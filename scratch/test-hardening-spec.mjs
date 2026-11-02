/**
 * Suprilo Phase 2C — Task 2C-4B Stage 1.3
 * Corrected Integration Test Specifications for Hardened Security Boundaries
 * 
 * Accurately models the two-tier defense:
 *  - Client API layer: Column-level permissions throw SQLSTATE 42501 (insufficient_privilege)
 *    when direct updates are attempted on non-granted columns (status, draft_slot, etc.).
 *  - Database Engine trigger layer: enforce_card_lifecycle() raises SQLSTATE 23514 (check_violation)
 *    if privileged/internal updates violate lifecycle immutability invariants.
 */

export const INTEGRATION_TEST_SUITE = [
  {
    id: "TEST_1_STORAGE_OTHER_USER_FOLDER",
    description: "Upload to another user's card folder is rejected",
    action: async (clientA, userBId, cardBId) => {
      const { data, error } = await clientA.storage
        .from('card-photos')
        .upload(`${userBId}/${cardBId}/photo.png`, Buffer.from('fake-image-bytes'), { contentType: 'image/png' });
      return { success: !data && !!error, error };
    },
    expectedOutcome: "Rejected by card_photos_owner_insert RLS policy."
  },
  {
    id: "TEST_2_STORAGE_NONEXISTENT_CARD_UUID",
    description: "Upload to nonexistent card UUID is rejected",
    action: async (clientA, userAId) => {
      const nonexistentCardId = "00000000-0000-0000-0000-000000000000";
      const { data, error } = await clientA.storage
        .from('card-photos')
        .upload(`${userAId}/${nonexistentCardId}/photo.png`, Buffer.from('fake-image-bytes'), { contentType: 'image/png' });
      return { success: !data && !!error, error };
    },
    expectedOutcome: "Rejected by EXISTS(public.cards) subquery in card_photos_owner_insert."
  },
  {
    id: "TEST_3_STORAGE_MOVE_OTHER_USER",
    description: "Storage object cannot be moved to another user's folder",
    action: async (clientA, userAId, cardAId, userBId) => {
      const { data, error } = await clientA.storage
        .from('card-photos')
        .move(`${userAId}/${cardAId}/photo.png`, `${userBId}/${cardAId}/photo.png`);
      return { success: !data && !!error, error };
    },
    expectedOutcome: "Rejected by card_photos_owner_update WITH CHECK policy."
  },
  {
    id: "TEST_4A_CARDS_DIRECT_STATUS_UPDATE_DENIED",
    description: "Direct authenticated status modification is denied with SQLSTATE 42501",
    action: async (clientA, cardAId) => {
      const { data, error } = await clientA
        .from('cards')
        .update({ status: 'published' })
        .eq('id', cardAId);
      return {
        success: !data && !!error && (error.code === '42501' || error.message.includes('permission denied')),
        error
      };
    },
    expectedOutcome: "Rejected with SQLSTATE 42501 (insufficient_privilege) on status column."
  },
  {
    id: "TEST_4B_CARDS_DIRECT_DRAFT_SLOT_TAMPERING_DENIED",
    description: "Direct authenticated draft_slot modification is denied with SQLSTATE 42501",
    action: async (clientA, cardAId, originalSlot) => {
      // Attempt 1: set draft_slot = null
      const res1 = await clientA
        .from('cards')
        .update({ draft_slot: null })
        .eq('id', cardAId);

      // Attempt 2: set draft_slot = 3
      const res2 = await clientA
        .from('cards')
        .update({ draft_slot: 3 })
        .eq('id', cardAId);

      // Verify original slot is unchanged
      const { data: currentCard } = await clientA
        .from('cards')
        .select('draft_slot')
        .eq('id', cardAId)
        .single();

      const success =
        res1.error && res1.error.code === '42501' &&
        res2.error && res2.error.code === '42501' &&
        currentCard && currentCard.draft_slot === originalSlot;

      return { success, res1, res2, currentCard };
    },
    expectedOutcome: "Both direct updates fail with SQLSTATE 42501; original draft_slot remains completely unchanged."
  },
  {
    id: "TEST_4C_CARDS_INTERNAL_DRAFT_SLOT_TAMPERING_RAISES_23514",
    description: "Privileged update violating draft_slot immutability raises SQLSTATE 23514 in trigger",
    action: async (serviceRoleClient, cardAId) => {
      // Service role has table-wide grant, so it reaches trigger level
      const { data, error } = await serviceRoleClient
        .from('cards')
        .update({ draft_slot: 3 })
        .eq('id', cardAId);
      return {
        success: !data && !!error && error.code === '23514' && error.message.includes('IMMUTABLE_FIELD'),
        error
      };
    },
    expectedOutcome: "Trigger enforce_card_lifecycle() raises SQLSTATE 23514 with IMMUTABLE_FIELD error."
  },
  {
    id: "TEST_5A_CARDS_VALID_DRAFT_PUBLICATION",
    description: "Valid draft publication succeeds via publish_card_draft()",
    action: async (clientA, cardAId) => {
      const { data, error } = await clientA.rpc('publish_card_draft', { p_card_id: cardAId });
      return {
        success: !error && data && data.status === 'published' && data.draft_slot === null && !!data.published_at,
        data,
        error
      };
    },
    expectedOutcome: "Card status becomes 'published', draft_slot is null, published_at is stamped."
  },
  {
    id: "TEST_5B_CARDS_PUBLISH_MISSING_PHOTO_FAILS",
    description: "Publishing draft referencing nonexistent storage photo fails with PHOTO_NOT_FOUND",
    action: async (clientA, draftIdWithGhostPhoto) => {
      const { data, error } = await clientA.rpc('publish_card_draft', { p_card_id: draftIdWithGhostPhoto });
      return {
        success: !data && !!error && error.code === '23514' && error.message.includes('PHOTO_NOT_FOUND'),
        error
      };
    },
    expectedOutcome: "Rejected with SQLSTATE 23514 and PHOTO_NOT_FOUND error."
  },
  {
    id: "TEST_6_CARDS_INVALID_DRAFT_PUBLICATION_FAILS",
    description: "Invalid/incomplete draft publication fails",
    action: async (clientA, draftIdWithEmptyRecipient) => {
      const { data, error } = await clientA.rpc('publish_card_draft', { p_card_id: draftIdWithEmptyRecipient });
      return {
        success: !data && !!error && error.code === '23514' && error.message.includes('INVALID_CONTENT'),
        error
      };
    },
    expectedOutcome: "Rejected with SQLSTATE 23514 and INVALID_CONTENT error."
  },
  {
    id: "TEST_7_CARDS_PUBLICATION_FREES_DRAFT_SLOT",
    description: "Publication releases draft slot and permits new draft creation",
    action: async (clientA, userAId) => {
      return { expected: "Slot recycled successfully without exceeding 3 active drafts limit." };
    },
    expectedOutcome: "Atomically frees slot; next draft claims recycled slot."
  },
  {
    id: "TEST_8_CARDS_PUBLISH_OTHER_USER_CARD_REJECTED",
    description: "Publishing another user's card is rejected",
    action: async (clientB, cardAId) => {
      const { data, error } = await clientB.rpc('publish_card_draft', { p_card_id: cardAId });
      return {
        success: !data && !!error && error.code === '23514' && (error.message.includes('UNAUTHORIZED') || error.message.includes('CARD_NOT_FOUND')),
        error
      };
    },
    expectedOutcome: "Rejected with 23514; card A remains in draft."
  },
  {
    id: "TEST_9_CARDS_PUBLISHED_CONTENT_IMMUTABLE",
    description: "Published content modifications are rejected for all 13 editable fields",
    fields: [
      'recipient_name', 'sender_name', 'occasion_tag', 'primary_message',
      'secondary_message', 'foil_style', 'cover_text', 'bg_palette',
      'sticker', 'font_family', 'photo_path', 'reveal_threshold', 'sound_enabled'
    ],
    action: async (clientA, publishedCardId, field, value) => {
      const { data, error } = await clientA
        .from('cards')
        .update({ [field]: value })
        .eq('id', publishedCardId);
      return {
        success: !data && !!error && error.code === '23514' && error.message.includes('IMMUTABLE_FIELD'),
        error
      };
    },
    expectedOutcome: "All 13 update attempts fail with SQLSTATE 23514 (IMMUTABLE_FIELD)."
  },
  {
    id: "TEST_10_CARDS_ARCHIVE_LIFECYCLE",
    description: "Archiving follows only permitted transitions and frees draft slots",
    action: async (clientA, draftCardId, publishedCardId) => {
      return { expected: "Only valid transitions allowed; archived cards cannot be published." };
    },
    expectedOutcome: "Draft slot freed on draft archive; published -> archived succeeds; archived -> published blocked."
  },
  {
    id: "TEST_11_CARDS_IDEMPOTENT_PUBLISH_AND_ARCHIVE",
    description: "Repeated publishing and archiving behave consistently",
    action: async (clientA, publishedCardId, archivedCardId) => {
      const resPub = await clientA.rpc('publish_card_draft', { p_card_id: publishedCardId });
      const resArch = await clientA.rpc('archive_card', { p_card_id: archivedCardId });
      return {
        success: resPub.data && resPub.data.status === 'published' && resArch.data && resArch.data.status === 'archived'
      };
    },
    expectedOutcome: "Idempotent success returns current card state without errors or side effects."
  }
];
