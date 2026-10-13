"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings2, UserRound } from "lucide-react";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { useNotifications } from "@/components/providers/notification-provider";
import type { LoyaltySummary, User } from "@/types/api";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useApiQuery } from "@/lib/use-api";
import { ErrorAlert } from "@/components/feedback/Skeleton";

export function UserDropdown({
  user,
  onUserUpdated,
  onSignOut,
  showCustomerLinks = true,
}: {
  user: User;
  onUserUpdated: (user: User) => void;
  onSignOut: () => void;
  showCustomerLinks?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const { upcomingCount, unreadCount } = useNotifications();
  const loyalty = useApiQuery<LoyaltySummary>(showCustomerLinks ? ["/user/loyalty"] : null);
  const refreshLoyalty = loyalty.refresh;
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const initials = user.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("tr-TR");

  useEffect(() => {
    if (previousPathname.current !== pathname && showCustomerLinks) {
      refreshLoyalty();
    }
    previousPathname.current = pathname;
  }, [pathname, refreshLoyalty, showCustomerLinks]);

  return (
    <>
      <Menu>
        <MenuButton
          className="flex max-w-[min(15rem,45vw)] items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 py-1 pl-1 pr-3 text-left hover:bg-zinc-800"
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : initials || <UserRound size={15} />}
          </span>
          <span className="truncate text-xs font-medium text-zinc-200">{user.fullName}</span>
          {showCustomerLinks && loyalty.data && (
            <span className="shrink-0 text-[10px] text-amber-300" aria-label={`${loyalty.data.starCount} / 10 yıldız`}>
              ⭐ {loyalty.data.starCount}/10
            </span>
          )}
        </MenuButton>
            <MenuItems anchor="bottom end" className="z-50 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl [--anchor-gap:8px] focus:outline-none">
              <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : initials || <UserRound size={17} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-zinc-100">{user.fullName}</span>
                  <span className="mt-1 block truncate text-[11px] text-zinc-500">{user.email}</span>
                </span>
              </div>
              {showCustomerLinks && (
                <section className="space-y-2 border-b border-zinc-800 px-4 py-3" aria-label="Sadakat durumu">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-200">Yıldızlarım</span>
                    <span className="text-amber-300">⭐ {loyalty.data?.starCount ?? 0}/10</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-zinc-800"
                    role="progressbar"
                    aria-label="Ücretsiz hizmet için yıldız ilerlemesi"
                    aria-valuemin={0}
                    aria-valuemax={10}
                    aria-valuenow={loyalty.data?.starCount ?? 0}
                  >
                    <div
                      className="h-full rounded-full bg-amber-400 transition-[width]"
                      style={{ width: `${Math.min(loyalty.data?.starCount ?? 0, 10) * 10}%` }}
                    />
                  </div>
                  {loyalty.error ? (
                    <ErrorAlert message={loyalty.error} onRetry={loyalty.refresh} />
                  ) : (
                    (loyalty.data?.availableRewards ?? []).map((reward) => (
                      <p key={reward.id} className="text-[11px] text-emerald-300">
                        Ücretsiz hizmet hakkı · en fazla {reward.amountLimit.toLocaleString("tr-TR")} ₺ indirim
                      </p>
                    ))
                  )}
                </section>
              )}
              <div className="space-y-1 p-2">
                <MenuItem>
                  <button type="button" onClick={() => setEditing(true)} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs text-zinc-300 data-[focus]:bg-zinc-900">
                    <Settings2 size={15} /> Profilimi düzenle
                  </button>
                </MenuItem>
                {showCustomerLinks && <>
                  <MenuItem>
                    <Link href="/my-favorites" className="flex items-center rounded-md px-3 py-2.5 text-xs text-zinc-300 data-[focus]:bg-zinc-900">
                      Favorilerim
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link href="/my-appointments" className="flex items-center justify-between rounded-md px-3 py-2.5 text-xs text-zinc-300 data-[focus]:bg-zinc-900">
                      <span>Randevularım</span><span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">{upcomingCount}</span>
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link href="/notifications" className="flex items-center justify-between rounded-md px-3 py-2.5 text-xs text-zinc-300 data-[focus]:bg-zinc-900">
                      <span>Bildirimler</span><span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">{unreadCount}</span>
                    </Link>
                  </MenuItem>
                </>}
              </div>
              <div className="border-t border-zinc-800 p-2">
                <MenuItem>
                  <button type="button" onClick={onSignOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs text-rose-300 data-[focus]:bg-rose-950/30">
                    <LogOut size={15} /> Çıkış yap
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
      </Menu>
      {editing && <EditProfileModal user={user} onClose={() => setEditing(false)} onSaved={onUserUpdated} />}
    </>
  );
}
