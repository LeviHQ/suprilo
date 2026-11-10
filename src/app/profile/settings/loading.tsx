import { PageHeader } from "@/components/dashboard/PageHeader";

export default function SettingsLoading() {
  return (
    <div className="space-y-8 max-w-4xl animate-pulse">
      <PageHeader
        title="Account Settings"
        description="Manage your Suprilo creator identity, review security sessions, and configure profile preferences."
        badge="Account Center"
        badgeVariant="neutral"
        breadcrumbs={[
          { label: "Control Center", href: "/profile" },
          { label: "Account Settings" },
        ]}
      />

      {/* Skeleton Card 1 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-4">
        <div className="h-6 w-48 bg-brand-warm rounded-lg" />
        <div className="h-4 w-72 bg-brand-warm-subtle rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4">
          <div className="h-24 bg-brand-warm-subtle rounded-2xl" />
          <div className="h-24 bg-brand-warm-subtle rounded-2xl" />
          <div className="h-24 bg-brand-warm-subtle rounded-2xl" />
          <div className="h-24 bg-brand-warm-subtle rounded-2xl" />
        </div>
      </div>

      {/* Skeleton Card 2 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-4">
        <div className="h-6 w-40 bg-brand-warm rounded-lg" />
        <div className="h-4 w-80 bg-brand-warm-subtle rounded-lg" />
        <div className="h-10 max-w-lg bg-brand-warm-subtle rounded-xl" />
        <div className="h-20 max-w-lg bg-brand-warm-subtle rounded-xl" />
      </div>

      {/* Skeleton Card 3 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-warm-border shadow-card space-y-4">
        <div className="h-6 w-36 bg-brand-warm rounded-lg" />
        <div className="h-24 bg-brand-warm-subtle rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-28 bg-brand-warm-subtle rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

