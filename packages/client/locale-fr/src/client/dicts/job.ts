/**
 * French `job` namespace dictionary. Mirrors the shipped `en` key set.
 */
export const fr = {
  'count.live.one': '{count} tâche d’arrière-plan en cours',
  'count.live.other': '{count} tâches d’arrière-plan en cours',
  'count.idle.one': '{count} tâche d’arrière-plan',
  'count.idle.other': '{count} tâches d’arrière-plan',
  'list.aria': 'Tâches d’arrière-plan',
  'status.running': 'en cours',
  'status.stopping': 'arrêt en cours',
  'status.completed': 'terminé',
  'status.killed': 'annulé',
  'status.failed': 'échec',
  'duration.seconds': '{seconds}s',
  'duration.minutes': '{minutes}min {seconds}s',
  'duration.hours': '{hours}h {minutes}min',
  'duration.title.live': 'En cours depuis {duration}',
  'duration.title.done': 'A duré {duration}',
} as const
