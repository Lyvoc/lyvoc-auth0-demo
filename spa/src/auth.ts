import { useCallback } from "react";
import { useAuth0 as useAuth0Sdk, RedirectLoginOptions } from "@auth0/auth0-react";
import { useLanguage } from "./i18n";

/**
 * useAuth0() of the Auth0 SDK, whose logins open the Auth0 pages in the
 * portal's language (ui_locales; the tenant must enable it, en and fr on
 * demo-lyvoc). A login can still set its own ui_locales.
 */
export function useAuth0() {
  const auth = useAuth0Sdk();
  const { locale } = useLanguage();
  const { loginWithRedirect: sdkLogin } = auth;

  const loginWithRedirect = useCallback(
    (options?: RedirectLoginOptions) =>
      sdkLogin({
        ...options,
        authorizationParams: { ui_locales: locale, ...options?.authorizationParams },
      }),
    [sdkLogin, locale]
  );

  return { ...auth, loginWithRedirect };
}
