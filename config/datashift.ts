import env from '#start/env'

export default {
  limitPreview: env.get('DATASHIFT_PREVIEW_LIMIT', '100'),
  limitRun: env.get('DATASHIFT_RUN_LIMIT', '100'),
}
