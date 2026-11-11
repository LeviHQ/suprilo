import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');
const getVal = (k) => {
  const line = env.split(/\r?\n/).find(l => l.trim().startsWith(k + '='));
  if (!line) return '';
  return line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
};

const supabase = createClient(getVal('NEXT_PUBLIC_SUPABASE_URL'), getVal('SUPABASE_SERVICE_ROLE_KEY'));

async function syncGoogleAvatar() {
  const userId = '2ff093e0-c9dc-4c12-9018-4511ea67d052';
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  const realGooglePic = user.user_metadata?.picture;
  
  console.log('Real Google Picture:', realGooglePic);
  
  // Clean up user_metadata so avatar_url is real Google photo and preset fields are null
  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      avatar_type: 'google',
      custom_avatar_type: 'google',
      avatar_source: 'google',
      custom_avatar_source: 'google',
      custom_avatar: false,
      avatar_preset_id: null,
      custom_avatar_preset_id: null,
      custom_avatar_url: null,
      avatar_url: realGooglePic
    }
  });
  
  // Also clean up public.profiles
  await supabase.from('profiles').update({
    avatar_type: 'google',
    avatar_preset_id: null,
    custom_avatar_url: null,
    avatar_source: 'google'
  }).eq('user_id', userId);
  
  console.log('Synchronized Adarsh Mishra v to authentic Google Photo!');
}

syncGoogleAvatar();

