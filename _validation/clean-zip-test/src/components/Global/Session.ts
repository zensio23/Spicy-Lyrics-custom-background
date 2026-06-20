import { Query } from "../../utils/API/Query.ts";
import { $spicyLyricsVersion } from "../../utils/stores.ts";
import Global from "./Global.ts";

interface Location {
  pathname: string;
  search?: string;
  hash?: string;
  state?: Record<string, any>;
}

type VersionParsedData =
  | {
      Text: string;
      Major: number;
      Minor: number;
      Patch: number;
    }
  | undefined;

type BuildMetadata = {
  LoadedVersion: string;
  CompatibilityVersion: string;
  UpstreamBaseVersion: string;
  customBuild: boolean;
  disableBlockingUpdateScreen: boolean;
  preferLocalBuild: boolean;
  source: string;
};

let sessionHistory: Location[] = [];

function compareVersions(
  left: Exclude<VersionParsedData, undefined>,
  right: Exclude<VersionParsedData, undefined>
): number {
  if (left.Major !== right.Major) {
    return left.Major > right.Major ? 1 : -1;
  }
  if (left.Minor !== right.Minor) {
    return left.Minor > right.Minor ? 1 : -1;
  }
  if (left.Patch !== right.Patch) {
    return left.Patch > right.Patch ? 1 : -1;
  }
  return 0;
}

const Session = {
  Navigate: (data: Location) => {
    Spicetify.Platform.History.push(data);
    //Session.PushToHistory(data);
  },
  GoBack: () => {
    if (sessionHistory.length > 1) {
      Spicetify.Platform.History.goBack();
    } else {
      Session.Navigate({ pathname: "/" });
    }
  },
  GetPreviousLocation: () => {
    if (sessionHistory.length > 1) {
      return sessionHistory[sessionHistory.length - 2];
    }
    return null;
  },
  RecordNavigation: (data: Location) => {
    Session.PushToHistory(data);
    Global.Event.evoke("session:navigation", data);
  },
  FilterOutTheSameLocation: (data: Location) => {
    const filtered = sessionHistory.filter(
      (location) =>
        location.pathname !== data.pathname &&
        location.search !== data?.search &&
        location.hash !== data?.hash
    );
    sessionHistory = filtered;
  },
  PushToHistory: (data: Location) => {
    sessionHistory.push(data);
  },
  SpicyLyrics: {
    GetBuildMetadata: (): BuildMetadata => {
      const metadata = window._spicy_lyrics_metadata ?? {};
      const loadedVersion = metadata.LoadedVersion ?? $spicyLyricsVersion.get();
      const compatibilityVersion = metadata.CompatibilityVersion ?? loadedVersion;
      const upstreamBaseVersion = metadata.UpstreamBaseVersion ?? compatibilityVersion;

      return {
        LoadedVersion: loadedVersion,
        CompatibilityVersion: compatibilityVersion,
        UpstreamBaseVersion: upstreamBaseVersion,
        customBuild: metadata.customBuild === true,
        disableBlockingUpdateScreen: metadata.disableBlockingUpdateScreen === true,
        preferLocalBuild: metadata.preferLocalBuild !== false,
        source: metadata.source ?? "unknown",
      };
    },
    ParseVersion: (version: string): VersionParsedData => {
      const versionMatches = version.match(/(\d+)\.(\d+)\.(\d+)/);

      if (versionMatches === null) {
        return undefined;
      }

      return {
        Text: versionMatches[0],

        Major: parseInt(versionMatches[1]),
        Minor: parseInt(versionMatches[2]),
        Patch: parseInt(versionMatches[3]),
      };
    },
    CompareVersions: compareVersions,
    GetCurrentDisplayVersion: (): string => {
      return Session.SpicyLyrics.GetBuildMetadata().LoadedVersion;
    },
    GetCompatibilityVersionText: (): string => {
      return Session.SpicyLyrics.GetBuildMetadata().CompatibilityVersion;
    },
    GetCurrentVersion: (): VersionParsedData => {
      return Session.SpicyLyrics.ParseVersion(Session.SpicyLyrics.GetCompatibilityVersionText());
    },
    GetLatestVersion: async (): Promise<VersionParsedData> => {
      try {
        const res = await Query([
          {
            operation: "ext_version",
          },
        ]);
        const versionJob = res.get("0");
        if (!versionJob || versionJob.httpStatus !== 200 || versionJob.format !== "text") {
          return undefined;
        }
        const data = versionJob.data;
        return Session.SpicyLyrics.ParseVersion(data);
      } catch {
        return undefined;
      }
    },
    IsOutdated: async (): Promise<boolean> => {
      const latestVersion = await Session.SpicyLyrics.GetLatestVersion();
      const currentVersion = Session.SpicyLyrics.GetCurrentVersion();

      if (latestVersion === undefined || currentVersion === undefined) return false;

      return Session.SpicyLyrics.CompareVersions(latestVersion, currentVersion) > 0;
    },
  },
};

export default Session;
