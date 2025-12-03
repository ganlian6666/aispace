import { onRequestGet as __api_comments_js_onRequestGet } from "E:\\Dev\\web\\functions\\api\\comments.js"
import { onRequestPost as __api_comments_js_onRequestPost } from "E:\\Dev\\web\\functions\\api\\comments.js"
import { onRequestGet as __api_export_js_onRequestGet } from "E:\\Dev\\web\\functions\\api\\export.js"
import { onRequestGet as __api_likes_js_onRequestGet } from "E:\\Dev\\web\\functions\\api\\likes.js"
import { onRequestPost as __api_likes_js_onRequestPost } from "E:\\Dev\\web\\functions\\api\\likes.js"
import { onRequestPost as __api_submit_js_onRequestPost } from "E:\\Dev\\web\\functions\\api\\submit.js"

export const routes = [
    {
      routePath: "/api/comments",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_comments_js_onRequestGet],
    },
  {
      routePath: "/api/comments",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_comments_js_onRequestPost],
    },
  {
      routePath: "/api/export",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_export_js_onRequestGet],
    },
  {
      routePath: "/api/likes",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_likes_js_onRequestGet],
    },
  {
      routePath: "/api/likes",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_likes_js_onRequestPost],
    },
  {
      routePath: "/api/submit",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_submit_js_onRequestPost],
    },
  ]