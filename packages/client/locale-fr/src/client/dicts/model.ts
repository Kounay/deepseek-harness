/**
 * French `model` namespace dictionary (in-conversation model picker copy:
 * trigger, menu, reasoning-effort choices, and status text). Mirrors the shipped `en` key set.
 */
export const fr = {
  'command.description': 'Sélectionner le modèle de cette conversation',
  'option.loadError': 'Échec du chargement du catalogue : {message}',
  'trigger.fallback': 'Sélectionner un modèle',
  'trigger.loading': 'Chargement des modèles…',
  'trigger.selectAria': 'Sélectionner un modèle',
  'trigger.aria': 'Sélectionner un modèle, actuel : {model}',
  'trigger.ariaEffort': 'Sélectionner un modèle, actuel : {model}, effort de raisonnement {effort}',
  'menu.aria': 'Modèle et effort de raisonnement',
  'menu.model': 'Modèle',
  'menu.effort': 'Effort de raisonnement',
  'effort.providerDefault': 'Par défaut',
  'status.loading': 'Actualisation de la liste des modèles…',
  'error.action': 'Échec de l’opération sur le modèle : {message}',
  'action.reload': 'Recharger',
  'warning.groupLoad': 'Échec du chargement de {name} : {message}',
  'empty.models': 'Aucun modèle disponible.',
  'blocked.composer': 'Ce modèle est indisponible — sélectionnez-en un pour continuer',
  'empty.efforts': 'Ce modèle ne propose aucun niveau d’effort de raisonnement.',
} as const
