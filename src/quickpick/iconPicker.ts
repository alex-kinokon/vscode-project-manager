import { l10n, QuickPickItem, ThemeIcon, window } from "vscode";
import { codicons } from "vscode-ext-codicons";

const VALID_CODICON_ID = /^[a-z][a-z0-9-]*$/;
const EXCLUDED_CODICON_IDS = new Set<string>([
    "loading", // animated, distracting as a project icon
    "sync~spin",
    "gear~spin"
]);

interface CodiconQuickPickItem extends QuickPickItem {
    codicon: string;
}

function getAllCodiconIds(): string[] {
    const ids = new Set<string>();
    for (const value of Object.values(codicons)) {
        if (typeof value !== "string") {
            continue;
        }
        // `codicons.X` returns wrapped strings like "$(remote-explorer)"; strip the wrapper.
        const match = /^\$\(([^)]+)\)$/.exec(value);
        const id = match ? match[1] : value;
        if (VALID_CODICON_ID.test(id) && !EXCLUDED_CODICON_IDS.has(id)) {
            ids.add(id);
        }
    }
    return [ ...ids ].sort();
}

export async function pickCodicon(currentIcon: string): Promise<string | undefined> {
    const defaultItem: CodiconQuickPickItem = {
        label: l10n.t("Use default icon"),
        iconPath: new ThemeIcon("history"),
        codicon: ""
    };

    const codiconItems: CodiconQuickPickItem[] = getAllCodiconIds().map(id => ({
        label: id,
        iconPath: new ThemeIcon(id),
        codicon: id
    }));

    const items: CodiconQuickPickItem[] = [ defaultItem, ...codiconItems ];

    const quickPick = window.createQuickPick<CodiconQuickPickItem>();
    quickPick.title = l10n.t("Pick an Icon");
    quickPick.placeholder = l10n.t("Type to filter codicons");
    quickPick.items = items;

    const preselected = items.find(item => item.codicon === currentIcon);
    if (preselected) {
        quickPick.activeItems = [ preselected ];
    }

    return await new Promise<string | undefined>((resolve) => {
        let resolved = false;

        const doResolve = (value: string | undefined) => {
            if (resolved) {
                return;
            }
            resolved = true;
            resolve(value);
        };

        quickPick.onDidAccept(() => {
            const picked = quickPick.selectedItems[0] ?? quickPick.activeItems[0];
            doResolve(picked ? picked.codicon : undefined);
            quickPick.hide();
            quickPick.dispose();
        });

        quickPick.onDidHide(() => {
            doResolve(undefined);
            quickPick.dispose();
        });

        quickPick.show();
    });
}
