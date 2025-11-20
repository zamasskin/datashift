import type { HttpContext } from '@adonisjs/core/http'

export default class PublicController {
  async terms(ctx: HttpContext) {
    const { inertia, i18n } = ctx
    const messages = {
      title: i18n.t('terms.title'),
      h1: i18n.t('terms.h1'),
      intro: i18n.t('terms.intro'),
      section1Title: i18n.t('terms.section1Title'),
      section1Body: i18n.t('terms.section1Body'),
      section2Title: i18n.t('terms.section2Title'),
      section2Body: i18n.t('terms.section2Body'),
      section3Title: i18n.t('terms.section3Title'),
      section3Body: i18n.t('terms.section3Body'),
      section4Title: i18n.t('terms.section4Title'),
      section4Body: i18n.t('terms.section4Body'),
      section5Title: i18n.t('terms.section5Title'),
      section5Body: i18n.t('terms.section5Body'),
      section6Title: i18n.t('terms.section6Title'),
      section6Body: i18n.t('terms.section6Body'),
      contactText: i18n.t('terms.contactText'),
      contactEmail: i18n.t('terms.contactEmail'),
    }

    return inertia.render('public/terms', { messages })
  }

  async privacy(ctx: HttpContext) {
    const { inertia, i18n } = ctx
    const messages = {
      title: i18n.t('privacy.title'),
      h1: i18n.t('privacy.h1'),
      intro: i18n.t('privacy.intro'),
      section1Title: i18n.t('privacy.section1Title'),
      section1Body: i18n.t('privacy.section1Body'),
      section2Title: i18n.t('privacy.section2Title'),
      section2Body: i18n.t('privacy.section2Body'),
      section3Title: i18n.t('privacy.section3Title'),
      section3Body: i18n.t('privacy.section3Body'),
      section4Title: i18n.t('privacy.section4Title'),
      section4Body: i18n.t('privacy.section4Body'),
      section5Title: i18n.t('privacy.section5Title'),
      section5Body: i18n.t('privacy.section5Body'),
      contactText: i18n.t('privacy.contactText'),
      contactEmail: i18n.t('privacy.contactEmail'),
    }

    return inertia.render('public/privacy', { messages })
  }
}
