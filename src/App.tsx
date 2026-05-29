import { LogIn, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type AuthMeResponse = {
  authenticated: boolean;
  principalType: string;
  name: string;
  email: string | null;
  displayName: string;
  provider: string | null;
};

type SessionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "authenticated"; data: AuthMeResponse }
  | { status: "unauthenticated"; message: string }
  | { status: "error"; message: string };

const loginTargets = [
  {
    provider: "Google",
    path: "/oauth2/authorization/google",
  },
  {
    provider: "GitHub",
    path: "/oauth2/authorization/github",
  },
];

export function App() {
  const [session, setSession] = useState<SessionState>({ status: "idle" });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const checkSession = useCallback(async () => {
    setSession({ status: "loading" });

    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.status === 401) {
        setSession({
          status: "unauthenticated",
          message: "로그인된 세션이 없습니다.",
        });
        return;
      }

      if (!response.ok) {
        setSession({
          status: "error",
          message: `세션 확인 실패: HTTP ${response.status}`,
        });
        return;
      }

      const data = (await response.json()) as AuthMeResponse;
      setSession({ status: "authenticated", data });
    } catch (error) {
      setSession({
        status: "error",
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      });
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("oauth") === "failed") {
      setSession({
        status: "error",
        message: "OAuth 로그인에 실패했습니다.",
      });
      return;
    }

    void checkSession();
  }, [checkSession]);

  async function logout() {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok && response.status !== 401) {
        setSession({
          status: "error",
          message: `로그아웃 실패: HTTP ${response.status}`,
        });
        return;
      }

      await checkSession();
    } catch (error) {
      setSession({
        status: "error",
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="tool-panel" aria-labelledby="page-title">
        <div className="heading-row">
          <ShieldCheck className="heading-icon" aria-hidden="true" />
          <div>
            <p className="eyebrow">OAuth Smoke Test</p>
            <h1 id="page-title">해내요 OAuth 테스트</h1>
          </div>
        </div>

        <div className="actions" aria-label="OAuth 로그인">
          {loginTargets.map((target) => (
            <a className="button primary" href={target.path} key={target.provider}>
              <LogIn aria-hidden="true" />
              {target.provider} 로그인
            </a>
          ))}
        </div>

        <div className="actions secondary-actions">
          <button className="button" onClick={checkSession} type="button">
            <RefreshCw aria-hidden="true" />
            내 세션 확인
          </button>
          <button className="button danger" disabled={isLoggingOut} onClick={logout} type="button">
            <LogOut aria-hidden="true" />
            {isLoggingOut ? "로그아웃 중" : "로그아웃"}
          </button>
        </div>

        <SessionResult session={session} />
      </section>
    </main>
  );
}

function SessionResult({ session }: { session: SessionState }) {
  if (session.status === "idle") {
    return (
      <div className="result muted">
        <span className="status-dot" />
        세션 상태를 아직 확인하지 않았습니다.
      </div>
    );
  }

  if (session.status === "loading") {
    return (
      <div className="result muted">
        <span className="status-dot loading" />
        세션을 확인하는 중입니다.
      </div>
    );
  }

  if (session.status === "unauthenticated" || session.status === "error") {
    return (
      <div className={`result ${session.status === "error" ? "error" : "muted"}`}>
        <span className="status-dot" />
        {session.message}
      </div>
    );
  }

  return (
    <dl className="session-grid" aria-label="현재 세션 정보">
      <div>
        <dt>authenticated</dt>
        <dd>{String(session.data.authenticated)}</dd>
      </div>
      <div>
        <dt>principalType</dt>
        <dd>{session.data.principalType}</dd>
      </div>
      <div>
        <dt>name</dt>
        <dd>{session.data.name}</dd>
      </div>
      <div>
        <dt>email</dt>
        <dd>{session.data.email ?? "-"}</dd>
      </div>
      <div>
        <dt>displayName</dt>
        <dd>{session.data.displayName}</dd>
      </div>
      <div>
        <dt>provider</dt>
        <dd>{session.data.provider ?? "-"}</dd>
      </div>
    </dl>
  );
}
