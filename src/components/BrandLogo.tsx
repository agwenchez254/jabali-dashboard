/** The Jabali logo. Two artworks are in the page and the dark class shows the one that suits the theme. `onDark` is for the sidebar: the chosen sidebar style decides which artwork shows, through --sb-logo-dark and --sb-logo-light. */
export function BrandLogo({ className = "h-10", onDark = false }: { className?: string; onDark?: boolean }) {
  if (onDark) {
    return (
      <>
        <img src="/brand/jabali-sassy-men-dark.svg" alt="Jabali" width={548} height={288} className={`${className} w-auto [display:var(--sb-logo-dark)]`} />
        <img src="/brand/jabali-sassy-men-light.svg" alt="" aria-hidden="true" width={548} height={288} className={`${className} w-auto [display:var(--sb-logo-light)]`} />
      </>
    );
  }
  return (
    <>
      <img src="/brand/jabali-sassy-men-light.svg" alt="Jabali" width={548} height={288} className={`${className} w-auto dark:hidden`} />
      <img src="/brand/jabali-sassy-men-dark.svg" alt="Jabali" width={548} height={288} className={`${className} hidden w-auto dark:block`} />
    </>
  );
}

/** The round "j" badge, for tight spaces such as the collapsed sidebar. */
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return <img src="/brand/jabali-sassy-mark-men-light.svg" alt="Jabali" width={64} height={64} className={className} />;
}
