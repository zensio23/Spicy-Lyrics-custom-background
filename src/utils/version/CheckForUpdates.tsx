import React from "react";
import { flushSync } from "react-dom";
import { isDev } from "../../components/Global/Defaults.ts";
import Session from "../../components/Global/Session.ts";
import ReactDOM from "react-dom/client";
import { PopupModal } from "../../components/Modal.ts";
import { toast } from "sonner";
import { $dismissedUpdateVersion } from "../uiState.ts";

let ShownUpdateNoticeVersion = "";
let ShownCustomRefreshNotice = false;

function versionText(version: any): string {
  return typeof version?.Text === "string" ? version.Text : "";
}

function rememberDismissal(latestVersion: any) {
  const latestText = versionText(latestVersion);
  if (latestText) {
    $dismissedUpdateVersion.set(latestText);
  }
}

async function copyUpdateCommand() {
  const command = "update-from-upstream.bat";
  try {
    await navigator.clipboard.writeText(command);
    toast.success("Copied update-from-upstream.bat");
  } catch {
    toast.message(`Run ${command} in the custom repo folder.`);
  }
}

export function showUpdateActionModal(currentVersion?: any, latestVersion?: any) {
  const div = document.createElement("div");
  const reactRoot = ReactDOM.createRoot(div);
  const closeModal = () => {
    rememberDismissal(latestVersion);
    PopupModal.hide();
  };

  flushSync(() => {
    reactRoot.render(
      <div className="update-card-wrapper">
        <h2 className="uc-title">Update Custom Build</h2>
        <p className="uc-subtitle">
          This custom build updates outside Spotify so the local visualizer build stays active.
        </p>
        <p className="uc-subtitle" style={{ fontSize: "var(--text-caption-size)", opacity: 0.72 }}>
          Run <code>update-from-upstream.bat</code> in the custom repo folder. It tries to update
          from upstream, rebuilds with Bun, copies the local build into Spicetify, and runs
          <code> spicetify apply</code>.
        </p>

        {(currentVersion || latestVersion) && (
          <div className="uc-version-row">
            <span className="uc-ver">{versionText(currentVersion) || "Current"}</span>
            <span className="uc-arrow" aria-hidden="true">
              <svg
                width="14"
                height="10"
                viewBox="0 0 14 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 5h12M9 1l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="uc-ver new">{versionText(latestVersion) || "Latest"}</span>
          </div>
        )}

        <div className="uc-actions">
          <button type="button" className="btn-quiet" onClick={closeModal}>
            Close
          </button>
          <button
            type="button"
            className="btn-update"
            onClick={() => {
              void copyUpdateCommand();
            }}
          >
            Copy Command
          </button>
        </div>
      </div>
    );
  });

  PopupModal.display({
    title: "Spicy Lyrics",
    content: div,
    onClose: () => reactRoot.unmount(),
    closeHandler: closeModal,
  });
}

function presentUpdateAvailable(currentVersion: any, latestVersion: any) {
  const latestText = versionText(latestVersion);
  let viewClicked = false;

  toast(
    <div>
      <div style={{ fontSize: "var(--text-headline-size)", fontWeight: 600, lineHeight: 1.3 }}>
        Spicy Lyrics {latestText || "update"} is available
      </div>
      <div style={{ fontSize: "var(--text-caption-size)", opacity: 0.65, marginTop: "2px" }}>
        New lyrics features and fixes.
      </div>
    </div>,
    {
      id: latestText ? `sl-update-${latestText}` : "sl-update",
      duration: Infinity,
      closeButton: true,
      action: {
        label: "View",
        onClick: () => {
          viewClicked = true;
          showUpdateActionModal(currentVersion, latestVersion);
        },
      },
      position: "bottom-right",
      onDismiss: () => {
        if (!viewClicked) {
          rememberDismissal(latestVersion);
        }
      },
    }
  );
}

export function showCustomBuildRefreshNotice(message?: string) {
  if (ShownCustomRefreshNotice) return;
  ShownCustomRefreshNotice = true;

  toast.warning(
    <div>
      <div style={{ fontSize: "var(--text-headline-size)", fontWeight: 600, lineHeight: 1.3 }}>
        Local refresh recommended
      </div>
      <div
        style={{
          fontSize: "var(--text-caption-size)",
          opacity: 0.75,
          marginTop: "2px",
          lineHeight: 1.4,
        }}
      >
        {message ||
          "This custom build received an upstream update prompt. Refresh the local build instead of restarting Spotify."}
      </div>
    </div>,
    {
      duration: 12000,
      action: {
        label: "Update now",
        onClick: () => {
          showUpdateActionModal(Session.SpicyLyrics.GetCurrentVersion(), undefined);
        },
      },
      position: "bottom-right",
      onDismiss: () => {
        ShownCustomRefreshNotice = false;
      },
      onAutoClose: () => {
        ShownCustomRefreshNotice = false;
      },
    }
  );
}

export async function CheckForUpdates(force: boolean = false) {
  if (isDev) return;

  const currentVersion = Session.SpicyLyrics.GetCurrentVersion();
  const latestVersion = await Session.SpicyLyrics.GetLatestVersion();

  if (!currentVersion || !latestVersion) {
    return;
  }

  const latestText = versionText(latestVersion);
  if (Session.SpicyLyrics.CompareVersions(latestVersion, currentVersion) <= 0) {
    if ($dismissedUpdateVersion.get()) {
      $dismissedUpdateVersion.set("");
    }
    ShownUpdateNoticeVersion = "";
    return;
  }

  if (!force) {
    if (ShownUpdateNoticeVersion === latestText) return;
    if ($dismissedUpdateVersion.get() === latestText) return;
  }

  presentUpdateAvailable(currentVersion, latestVersion);
  ShownUpdateNoticeVersion = latestText;
}

// ---- dev stuff ------

function fakeLatestVersion(updateTo: string) {
  const parsed = Session.SpicyLyrics.ParseVersion(updateTo);
  if (parsed) return parsed;
  return {
    Text: updateTo,
    Major: 9,
    Minor: 9,
    Patch: 9,
  };
}

export function triggerSpicyLyricsFakeUpdate(options: { updateTo: string }) {
  const currentVersion = Session.SpicyLyrics.GetCurrentVersion();
  const latestVersion = fakeLatestVersion(options.updateTo);
  presentUpdateAvailable(currentVersion, latestVersion);
}
