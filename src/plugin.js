import Vue from 'vue'
import Prismic from 'prismic-javascript'
import PrismicDOM from 'prismic-dom'

const moduleOptions = <%= serialize(options) %>

export default async ({ app, req, route, res, query, redirect }, inject) => {
  let options = {};

  // Pass through server requests, primarily for preview
  if (process.server) {
    options.req = req
  }

  let api = await Prismic.api(moduleOptions.endpoint, options);

  let prismic = new Vue({
    computed: {
      api() {
        return api
      },
      predicates() {
        return Prismic.Predicates
      },
      dom() {
        return PrismicDOM
      }
    },
    methods: {
      asHtml(richText) {
        if (richText) {
          return PrismicDOM.RichText.asHtml(
            richText,
            moduleOptions.linkResolver,
            moduleOptions.htmlSerializer
          )
        }
      },
      asText(richText) {
        if (richText) {
          return PrismicDOM.RichText.asText(richText)
        }
      },
      asLink(link) {
        if (link) {
          return PrismicDOM.Link.url(
            link,
            moduleOptions.linkResolver
          )
        }
      },
      asDate(date) {
        if (date) {
          return PrismicDOM.Date(date)
        }
      },
      ...(moduleOptions.linkResolver && { linkResolver: moduleOptions.linkResolver }),
      ...(moduleOptions.htmlSerializer && { htmlSerializer: moduleOptions.htmlSerializer })
    }
  });

  inject('prismic', prismic);

  // Preview support
  if (route.path === '/preview') {
    const { token } = query;

    if (token) {
      let url = await api.previewSession(token, moduleOptions.linkResolver, '/');

      let cookie = [
          `${Prismic.previewCookie}=${token}`,
          `max-age=${30 * 60 * 1000}`,
          'path=/'
      ].join("; ");

      if (process.server) {
        // Server-side
        res.setHeader('Set-Cookie', [cookie])
      } else {
        // Client-side
        document.cookie = cookie
      }

      redirect(302, url)
    } else {
      redirect(302, '/')
    }
  }
}
