# Fork DeepSeek Harness — récapitulatif des modifications

Document de suivi partagé, à lire par l'humain et l'agent. Il décrit ce que contient le fork, comment il est intégré, comment le vérifier et comment recevoir les mises à jour de l'amont.

## Identité du fork

| Élément | Valeur |
|---|---|
| Fork | https://github.com/Kounay/deepseek-harness |
| Amont (`upstream`) | https://github.com/deepseek-ai/deepseek-harness |
| Branche publiée | `master` (fork) |
| Base du fork | `49a606bc5b` — release `dsh-0.1.2-alpha.5` |
| Features | 2 commits directs sur `master` |
| Branche de synchronisation | `sync/upstream-0.1.6` (merge de l'amont 0.1.6, en cours de validation) |

## Contenu publié sur `master`

| Commit | Message | Contenu |
|---|---|---|
| `5e27359685` | `feat(web): ship French language pack for the GUI` | Nouveau paquet `packages/client/locale-fr` (42 fichiers, +1684) |
| `bd0ec6b622` | `feat(web): git status bar above the composer` | Contrôleur `gitStatus`, UI `ui-git-status`, slot `conversation.composer.status`, intégrations (34 fichiers, +1526/−9) |

Le commit `bd0ec6b622` remplace `bf088e5a03` (amend) pour inclure les séparateurs `·` entre compteurs.

## Fonctionnalité 1 — Interface en français

Paquet `@deepseek-ai/dsh-client-locale-fr` (`packages/client/locale-fr/`) : language pack qui enregistre la langue `fr` (libellé « Français », repli `en`) via `ctx.locale.addLanguage`, puis un dictionnaire français par domaine via `ctx.locale.register(ns, 'fr', dict)` — sans toucher aux couples `zh`/`en` embarqués.

Couverture : **34 domaines** (namespace `common`, `settings.*`, `sidebar`, `workspace`, `chat`, `conversation`, `trajectory`, `subagent`, `git`, `cordis`, …), environ **1 500 clés**, placeholders `{...}` préservés.

Choix d'architecture : le mécanisme de language pack est celui prévu par `dsh-client-locale` (README : « external client plugins can add languages and their namespace dictionaries ») ; les dictionnaires vivent dans `src/client/dicts/*.ts` et sont listés par le manifeste `src/client/dicts/index.ts`.

Sélection côté utilisateur : **Réglages → Général → Language → Français** ; détection automatique si le navigateur est en français.

## Fonctionnalité 2 — Barre d'état git au-dessus du composer

Host — `@deepseek-ai/dsh-api-git-status-controller` (`packages/api/git-status-controller/`) : namespace Remote `gitStatus`, méthode `read(dir, signal)` qui résout la racine du dépôt (`git rev-parse --show-toplevel`), lit `git status --porcelain=v1 -b --branch` via `execFile` (jamais de shell, timeout 10 s) et renvoie branche, ahead/behind, compteurs **modifiés / supprimés / non suivis**, la racine du work tree, et l'identité GitHub de `origin` (parseur `parseGithubRemote`, formes https et ssh). Hors dépôt : `isRepo: false`, sans erreur.

Client — `@deepseek-ai/dsh-client-ui-git-status` (`packages/client/ui-git-status/`) : occupe le slot dédié `conversation.composer.status` (kind `single`, scope `session`) rendu entre le dock et la barre de saisie. Contrôleur `GitStatusBarController` qui suit `sessions.list` (changement de session ou de `cwd` → nouvelle lecture) + rafraîchissement manuel, et publie un snapshot dans le compartiment `hooks` (`useGitStatus`).

Présentation : carte « tip » alignée sur l'axe de largeur du chat (`--dsh-composer-card-max-width`, largeur dynamique), icône branche, fond `--dsw-specific-tip` (identique aux cartes Todo/Queue/Objectif), bordure hairline 0.5 px, arrondis 10 px, hauteur 34 px.

Interactions : clic sur le **nom du dépôt** → ouvre le dossier local via `remote.session.openWorkspacePath` (repli silencieux sans ouvreur natif) ; clic sur la **branche** → ouvre `https://github.com/<owner>/<repo>/tree/<branche>` dans un nouvel onglet, uniquement si `origin` est GitHub (sinon branche en texte, aucun lien mort) ; HEAD détaché → texte ; compteurs séparés par `·`.

## Surfaces d'intégration touchées

| Surface | Fichiers |
|---|---|
| Slot parent | `packages/client/ui-conversation/src/client/contract/slots.ts` (SlotMap + children de la factory `conversation.content`), `.../apply.ts`, `.../skeleton/ConversationContent.tsx` |
| Remote client | `packages/api/remotes/src/client/index.ts` (import + `$mount`), `packages/api/remotes/package.json`, `packages/api/remotes/tsconfig.client.json` |
| Bundle web | `packages/bundle/web-app/cordis.patch.yml` (rangs `git-status-controller`, `locale-fr`, `ui-git-status`), `packages/bundle/web-app/package.json` |
| Agrégats TypeScript | `tsconfig.base.json` (paths), `tsconfig.client.json`, `tsconfig.host.json` |
| Généré | `packages/extensions/cordis-client-runner/src/client/slot-catalog.ts` (régénéré par `pnpm run gen-client-catalog`) |
| Lockfile | `pnpm-lock.yaml` |
| Non inclus volontairement | `.agents/skills/pomasa/` (résidu d'environnement, non suivi) |

## Vérifications passées sur la base 0.1.2

- Specs : **42 verts** (contrôleur 18, UI 15, locale-fr 9).
- `tsc -b` paquets et **agrégat client** : OK ; `oxlint` zone : 0 erreur.
- Bundles reconstruits (`ui-git-status` ≈ 14,3 ko, `locale-fr` ≈ 63,9 ko), build hôte OK.
- Vérification visuelle dans la GUI : barre affichée au-dessus du composer, liens testés (dossier local + GitHub), décompte réel du dépôt (`13 modifiés · 0 supprimé · 4 non suivis`).
- Après un changement de code client ou hôte : rebuild des bundles concernés puis rafraîchissement de http://127.0.0.1:3080 ; un **rang nouveau** ou un changement de profil exige un redémarrage de `pnpm dsh web`.

## Synchronisation avec l'amont

Contexte : l'amont est à `ddefc45fbc` (**0.1.6-alpha.2**), soit **3141 commits** au-dessus de la base du fork.

Branche `sync/upstream-0.1.6` : merge de `upstream/master` avec nos 2 commits. Six conflits ont été résolus en partant de l'amont puis en réappliquant nos ajouts — `pnpm-lock.yaml` et `slot-catalog.ts` (régénérés), `web-app/package.json` (3 dépendances), `api/remotes/src/client/index.ts` (import + montage), `ui-conversation` (SlotMap + children de la factory `conversation.content` + rendu, le rendu du composer ayant été déplacé vers `ConversationContent.tsx`). Les rangs du bundle et les refs `tsconfig` avaient survécu au merge automatique.

Adaptations nécessaires après le merge :

- `pnpm install` sur le lockfile 0.1.6 (317 projets) puis `pnpm run build:lib:host` pour régénérer les artefacts Typert (`…/remote`) de tout l'arbre.
- Rupture d'API : `SessionListState` n'expose plus `current`. Le contrôleur UI suit désormais la session du siège via `watch(sessionId)` (appelé par l'`inject` de l'entrée et par un `useEffect` du composant), et non plus la sélection globale.
- Deux clés du dictionnaire commun ont disparu en amont : `json.collapseNode` et `json.expandNode` sont retirées du dictionnaire `fr`.

État des vérifications sur 0.1.6 : 42 specs verts (contrôleur 18, UI 15, locale-fr 9), typecheck ciblé des trois paquets et typecheck agrégat client verts, lint 0 erreur, bundles `ui-git-status`, `locale-fr` et `ui-conversation` reconstruits.

Commandes de synchronisation ultérieure, avec `upstream` déjà configuré :

```bash
git fetch upstream
git merge upstream/master        # ou : git rebase upstream/master
pnpm install                     # si le lockfile a changé
pnpm run gen-client-catalog      # si un slot a été ajouté ou renommé
```

## Limites connues et suites

- Les namespaces UI ajoutés par l'amont après 0.1.2 (nouveaux paquets 0.1.6) ne sont pas encore traduits : ils s'affichent en anglais par repli, tant que le pack `fr` n'est pas étendu.
- Textes capturés à l'enregistrement (descriptions de commandes slash) et données natives du sélecteur de dossiers restent dans la langue d'enregistrement.
- Pas encore d'Agent Note ni de goldens e2e rafraîchis (`DSH_SNAPSHOT=replay pnpm run test:web`) ; pas de test « REAL-composition » Host pour le contrôleur.
- Le fork n'a pas de CI propre ; les portes du dépôt (coverage per-file, doc-sync, hygiene) n'ont été passées que partiellement.

## Journal

| Date | Opération | Résultat |
|---|---|---|
| 2026-09-02 | Language pack français + barre git développés et validés en local | 42 specs verts, GUI vérifiée |
| 2026-09-02 | Commits `5e27359685`, `bd0ec6b622` sur `master`, pushés sur `kounay/master` | Fork publié |
| 2026-09-02 | Récupération de l'amont 0.1.6 sur `sync/upstream-0.1.6` | 6 conflits résolus, adaptations `watch(sessionId)` et clés communes, 42 specs verts |
