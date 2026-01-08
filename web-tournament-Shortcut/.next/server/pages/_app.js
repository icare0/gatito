/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next-auth/react */ \"next-auth/react\");\n/* harmony import */ var next_auth_react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_auth_react__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var next_i18next__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! next-i18next */ \"next-i18next\");\n/* harmony import */ var next_i18next__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_i18next__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! next/router */ \"next/router\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_4__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_5__);\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! next/head */ \"next/head\");\n/* harmony import */ var next_head__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(next_head__WEBPACK_IMPORTED_MODULE_6__);\n// pages/_app.js\n\n\n\n\n\n\n\nfunction MyApp({ Component , pageProps  }) {\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_4__.useRouter)();\n    const [loading, setLoading] = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false);\n    const [mounted, setMounted] = (0,react__WEBPACK_IMPORTED_MODULE_5__.useState)(false);\n    // S'assurer que le composant est monté avant d'ajouter des event listeners\n    (0,react__WEBPACK_IMPORTED_MODULE_5__.useEffect)(()=>{\n        setMounted(true);\n        // Initialiser le mode sombre basé sur les préférences sauvegardées ou système\n        const initDarkMode = ()=>{\n            // Vérifier s'il s'agit du navigateur\n            if (false) {}\n        };\n        // Initialiser le thème dès que possible\n        initDarkMode();\n        return ()=>setMounted(false);\n    }, []);\n    (0,react__WEBPACK_IMPORTED_MODULE_5__.useEffect)(()=>{\n        if (!mounted) return;\n        const handleStart = (url)=>{\n            // Ne pas déclencher d'écran de chargement si c'est juste un changement de locale\n            if (url.includes(router.pathname) && url !== router.asPath) {\n                return;\n            }\n            setLoading(true);\n        };\n        const handleComplete = ()=>setLoading(false);\n        router.events.on(\"routeChangeStart\", handleStart);\n        router.events.on(\"routeChangeComplete\", handleComplete);\n        router.events.on(\"routeChangeError\", handleComplete);\n        return ()=>{\n            router.events.off(\"routeChangeStart\", handleStart);\n            router.events.off(\"routeChangeComplete\", handleComplete);\n            router.events.off(\"routeChangeError\", handleComplete);\n        };\n    }, [\n        router,\n        mounted\n    ]);\n    // Détection de la langue\n    (0,react__WEBPACK_IMPORTED_MODULE_5__.useEffect)(()=>{\n        // Only run once on client-side to prevent multiple redirects\n        if (false) {}\n    }, [\n        router.locale,\n        router.asPath,\n        mounted\n    ]);\n    // Script d'initialisation du mode sombre\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)((next_head__WEBPACK_IMPORTED_MODULE_6___default()), {\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"script\", {\n                    dangerouslySetInnerHTML: {\n                        __html: `\r\n              (function() {\r\n                // On exécute ce script immédiatement pour éviter le flash de contenu blanc\r\n                try {\r\n                  var savedTheme = localStorage.getItem('theme');\r\n                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;\r\n                  \r\n                  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {\r\n                    document.documentElement.classList.add('dark');\r\n                  }\r\n                } catch (err) {\r\n                  console.error('Failed to initialize dark mode', err);\r\n                }\r\n              })();\r\n            `\n                    }\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\antoi\\\\Github\\\\web-tournament-Shortcut\\\\pages\\\\_app.js\",\n                    lineNumber: 99,\n                    columnNumber: 9\n                }, this)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\antoi\\\\Github\\\\web-tournament-Shortcut\\\\pages\\\\_app.js\",\n                lineNumber: 98,\n                columnNumber: 7\n            }, this),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(next_auth_react__WEBPACK_IMPORTED_MODULE_2__.SessionProvider, {\n                session: pageProps.session,\n                children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                    ...pageProps\n                }, void 0, false, {\n                    fileName: \"C:\\\\Users\\\\antoi\\\\Github\\\\web-tournament-Shortcut\\\\pages\\\\_app.js\",\n                    lineNumber: 120,\n                    columnNumber: 9\n                }, this)\n            }, void 0, false, {\n                fileName: \"C:\\\\Users\\\\antoi\\\\Github\\\\web-tournament-Shortcut\\\\pages\\\\_app.js\",\n                lineNumber: 119,\n                columnNumber: 7\n            }, this)\n        ]\n    }, void 0, true);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,next_i18next__WEBPACK_IMPORTED_MODULE_3__.appWithTranslation)(MyApp));\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdCQUFnQjs7QUFDZTtBQUNtQjtBQUNBO0FBQ1Y7QUFDSTtBQUNmO0FBRTdCLFNBQVNNLE1BQU0sRUFBRUMsVUFBUyxFQUFFQyxVQUFTLEVBQUUsRUFBRTtJQUN2QyxNQUFNQyxTQUFTUCxzREFBU0E7SUFDeEIsTUFBTSxDQUFDUSxTQUFTQyxXQUFXLEdBQUdQLCtDQUFRQSxDQUFDLEtBQUs7SUFDNUMsTUFBTSxDQUFDUSxTQUFTQyxXQUFXLEdBQUdULCtDQUFRQSxDQUFDLEtBQUs7SUFFNUMsMkVBQTJFO0lBQzNFRCxnREFBU0EsQ0FBQyxJQUFNO1FBQ2RVLFdBQVcsSUFBSTtRQUVmLDhFQUE4RTtRQUM5RSxNQUFNQyxlQUFlLElBQU07WUFDekIscUNBQXFDO1lBQ3JDLElBQUksS0FBa0IsRUFBYSxFQVVsQztRQUNIO1FBRUEsd0NBQXdDO1FBQ3hDQTtRQUVBLE9BQU8sSUFBTUQsV0FBVyxLQUFLO0lBQy9CLEdBQUcsRUFBRTtJQUVMVixnREFBU0EsQ0FBQyxJQUFNO1FBQ2QsSUFBSSxDQUFDUyxTQUFTO1FBRWQsTUFBTWUsY0FBYyxDQUFDQyxNQUFRO1lBQzNCLGlGQUFpRjtZQUNqRixJQUFJQSxJQUFJQyxRQUFRLENBQUNwQixPQUFPcUIsUUFBUSxLQUFLRixRQUFRbkIsT0FBT3NCLE1BQU0sRUFBRTtnQkFDMUQ7WUFDRixDQUFDO1lBQ0RwQixXQUFXLElBQUk7UUFDakI7UUFFQSxNQUFNcUIsaUJBQWlCLElBQU1yQixXQUFXLEtBQUs7UUFFN0NGLE9BQU93QixNQUFNLENBQUNDLEVBQUUsQ0FBQyxvQkFBb0JQO1FBQ3JDbEIsT0FBT3dCLE1BQU0sQ0FBQ0MsRUFBRSxDQUFDLHVCQUF1QkY7UUFDeEN2QixPQUFPd0IsTUFBTSxDQUFDQyxFQUFFLENBQUMsb0JBQW9CRjtRQUVyQyxPQUFPLElBQU07WUFDWHZCLE9BQU93QixNQUFNLENBQUNFLEdBQUcsQ0FBQyxvQkFBb0JSO1lBQ3RDbEIsT0FBT3dCLE1BQU0sQ0FBQ0UsR0FBRyxDQUFDLHVCQUF1Qkg7WUFDekN2QixPQUFPd0IsTUFBTSxDQUFDRSxHQUFHLENBQUMsb0JBQW9CSDtRQUN4QztJQUNGLEdBQUc7UUFBQ3ZCO1FBQVFHO0tBQVE7SUFFcEIseUJBQXlCO0lBQ3pCVCxnREFBU0EsQ0FBQyxJQUFNO1FBQ2QsNkRBQTZEO1FBQzdELElBQUksS0FBd0NTLEVBQUUsRUF5QjdDO0lBQ0gsR0FBRztRQUFDSCxPQUFPb0MsTUFBTTtRQUFFcEMsT0FBT3NCLE1BQU07UUFBRW5CO0tBQVE7SUFFMUMseUNBQXlDO0lBQ3pDLHFCQUNFOzswQkFDRSw4REFBQ1Asa0RBQUlBOzBCQUNILDRFQUFDNkM7b0JBQ0NDLHlCQUF5Qjt3QkFDdkJDLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7WUFjVCxDQUFDO29CQUNIOzs7Ozs7Ozs7OzswQkFHSiw4REFBQ3BELDREQUFlQTtnQkFBQ3FELFNBQVM3QyxVQUFVNkMsT0FBTzswQkFDekMsNEVBQUM5QztvQkFBVyxHQUFHQyxTQUFTOzs7Ozs7Ozs7Ozs7O0FBSWhDO0FBRUEsaUVBQWVQLGdFQUFrQkEsQ0FBQ0ssTUFBTUEsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL3dlYi1wb2NrZXRleC8uL3BhZ2VzL19hcHAuanM/ZTBhZCJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBwYWdlcy9fYXBwLmpzXHJcbmltcG9ydCAnLi4vc3R5bGVzL2dsb2JhbHMuY3NzJztcclxuaW1wb3J0IHsgU2Vzc2lvblByb3ZpZGVyIH0gZnJvbSAnbmV4dC1hdXRoL3JlYWN0JztcclxuaW1wb3J0IHsgYXBwV2l0aFRyYW5zbGF0aW9uIH0gZnJvbSAnbmV4dC1pMThuZXh0JztcclxuaW1wb3J0IHsgdXNlUm91dGVyIH0gZnJvbSAnbmV4dC9yb3V0ZXInO1xyXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVN0YXRlIH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQgSGVhZCBmcm9tICduZXh0L2hlYWQnO1xyXG5cclxuZnVuY3Rpb24gTXlBcHAoeyBDb21wb25lbnQsIHBhZ2VQcm9wcyB9KSB7XHJcbiAgY29uc3Qgcm91dGVyID0gdXNlUm91dGVyKCk7XHJcbiAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xyXG4gIGNvbnN0IFttb3VudGVkLCBzZXRNb3VudGVkXSA9IHVzZVN0YXRlKGZhbHNlKTtcclxuXHJcbiAgLy8gUydhc3N1cmVyIHF1ZSBsZSBjb21wb3NhbnQgZXN0IG1vbnTDqSBhdmFudCBkJ2Fqb3V0ZXIgZGVzIGV2ZW50IGxpc3RlbmVyc1xyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBzZXRNb3VudGVkKHRydWUpO1xyXG4gICAgXHJcbiAgICAvLyBJbml0aWFsaXNlciBsZSBtb2RlIHNvbWJyZSBiYXPDqSBzdXIgbGVzIHByw6lmw6lyZW5jZXMgc2F1dmVnYXJkw6llcyBvdSBzeXN0w6htZVxyXG4gICAgY29uc3QgaW5pdERhcmtNb2RlID0gKCkgPT4ge1xyXG4gICAgICAvLyBWw6lyaWZpZXIgcydpbCBzJ2FnaXQgZHUgbmF2aWdhdGV1clxyXG4gICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICBjb25zdCBzYXZlZFRoZW1lID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3RoZW1lJyk7XHJcbiAgICAgICAgY29uc3QgcHJlZmVyc0RhcmsgPSB3aW5kb3cubWF0Y2hNZWRpYSgnKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKScpLm1hdGNoZXM7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQXBwbGlxdWVyIGxlIHRow6htZVxyXG4gICAgICAgIGlmIChzYXZlZFRoZW1lID09PSAnZGFyaycgfHwgKCFzYXZlZFRoZW1lICYmIHByZWZlcnNEYXJrKSkge1xyXG4gICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2RhcmsnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2RhcmsnKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIC8vIEluaXRpYWxpc2VyIGxlIHRow6htZSBkw6hzIHF1ZSBwb3NzaWJsZVxyXG4gICAgaW5pdERhcmtNb2RlKCk7XHJcbiAgICBcclxuICAgIHJldHVybiAoKSA9PiBzZXRNb3VudGVkKGZhbHNlKTtcclxuICB9LCBbXSk7XHJcblxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBpZiAoIW1vdW50ZWQpIHJldHVybjtcclxuXHJcbiAgICBjb25zdCBoYW5kbGVTdGFydCA9ICh1cmwpID0+IHtcclxuICAgICAgLy8gTmUgcGFzIGTDqWNsZW5jaGVyIGQnw6ljcmFuIGRlIGNoYXJnZW1lbnQgc2kgYydlc3QganVzdGUgdW4gY2hhbmdlbWVudCBkZSBsb2NhbGVcclxuICAgICAgaWYgKHVybC5pbmNsdWRlcyhyb3V0ZXIucGF0aG5hbWUpICYmIHVybCAhPT0gcm91dGVyLmFzUGF0aCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBzZXRMb2FkaW5nKHRydWUpO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgY29uc3QgaGFuZGxlQ29tcGxldGUgPSAoKSA9PiBzZXRMb2FkaW5nKGZhbHNlKTtcclxuXHJcbiAgICByb3V0ZXIuZXZlbnRzLm9uKCdyb3V0ZUNoYW5nZVN0YXJ0JywgaGFuZGxlU3RhcnQpO1xyXG4gICAgcm91dGVyLmV2ZW50cy5vbigncm91dGVDaGFuZ2VDb21wbGV0ZScsIGhhbmRsZUNvbXBsZXRlKTtcclxuICAgIHJvdXRlci5ldmVudHMub24oJ3JvdXRlQ2hhbmdlRXJyb3InLCBoYW5kbGVDb21wbGV0ZSk7XHJcblxyXG4gICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgcm91dGVyLmV2ZW50cy5vZmYoJ3JvdXRlQ2hhbmdlU3RhcnQnLCBoYW5kbGVTdGFydCk7XHJcbiAgICAgIHJvdXRlci5ldmVudHMub2ZmKCdyb3V0ZUNoYW5nZUNvbXBsZXRlJywgaGFuZGxlQ29tcGxldGUpO1xyXG4gICAgICByb3V0ZXIuZXZlbnRzLm9mZigncm91dGVDaGFuZ2VFcnJvcicsIGhhbmRsZUNvbXBsZXRlKTtcclxuICAgIH07XHJcbiAgfSwgW3JvdXRlciwgbW91bnRlZF0pO1xyXG5cclxuICAvLyBEw6l0ZWN0aW9uIGRlIGxhIGxhbmd1ZVxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICAvLyBPbmx5IHJ1biBvbmNlIG9uIGNsaWVudC1zaWRlIHRvIHByZXZlbnQgbXVsdGlwbGUgcmVkaXJlY3RzXHJcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgbW91bnRlZCkge1xyXG4gICAgICAvLyBDaGVjayBpZiBsYW5ndWFnZSBpcyBhbHJlYWR5IGRldGVjdGVkIG9yIHN0b3JlZFxyXG4gICAgICBjb25zdCBoYXNEZXRlY3RlZExhbmd1YWdlID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSgnbGFuZ3VhZ2UtZGV0ZWN0ZWQnKSA9PT0gJ3RydWUnO1xyXG4gICAgICBcclxuICAgICAgaWYgKCFoYXNEZXRlY3RlZExhbmd1YWdlKSB7XHJcbiAgICAgICAgLy8gTWFyayBsYW5ndWFnZSBhcyBkZXRlY3RlZCB0byBwcmV2ZW50IGZ1dHVyZSByZWRpcmVjdGlvbnNcclxuICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdsYW5ndWFnZS1kZXRlY3RlZCcsICd0cnVlJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gR2V0IGJyb3dzZXIgbGFuZ3VhZ2VcclxuICAgICAgICBjb25zdCBicm93c2VyTGFuZ3VhZ2UgPSBuYXZpZ2F0b3IubGFuZ3VhZ2UgfHwgbmF2aWdhdG9yLnVzZXJMYW5ndWFnZTtcclxuICAgICAgICBjb25zdCBkZXRlY3RlZExvY2FsZSA9IGJyb3dzZXJMYW5ndWFnZS5zdGFydHNXaXRoKCdmcicpID8gJ2ZyJyA6ICdlbic7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gT25seSByZWRpcmVjdCBpZiBvbiBhIGRpZmZlcmVudCBsb2NhbGUgYW5kIG5vdCBhbHJlYWR5IHByb2Nlc3NpbmcgYSByZWRpcmVjdFxyXG4gICAgICAgIGlmIChyb3V0ZXIubG9jYWxlICE9PSBkZXRlY3RlZExvY2FsZSAmJiAhcm91dGVyLmFzUGF0aC5pbmNsdWRlcygnP3JlZGlyZWN0ZWQ9dHJ1ZScpKSB7XHJcbiAgICAgICAgICAvLyBBZGQgcXVlcnkgcGFyYW0gdG8gcHJldmVudCByZWRpcmVjdCBsb29wc1xyXG4gICAgICAgICAgY29uc3Qgc2VwYXJhdG9yID0gcm91dGVyLmFzUGF0aC5pbmNsdWRlcygnPycpID8gJyYnIDogJz8nO1xyXG4gICAgICAgICAgY29uc3QgcmVkaXJlY3RQYXRoID0gYCR7cm91dGVyLmFzUGF0aH0ke3NlcGFyYXRvcn1yZWRpcmVjdGVkPXRydWVgO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBVc2UgcmVwbGFjZSBpbnN0ZWFkIG9mIHB1c2ggdG8gYXZvaWQgYWRkaW5nIHRvIGJyb3dzZXIgaGlzdG9yeVxyXG4gICAgICAgICAgcm91dGVyLnJlcGxhY2UocmVkaXJlY3RQYXRoLCByZWRpcmVjdFBhdGgsIHsgXHJcbiAgICAgICAgICAgIGxvY2FsZTogZGV0ZWN0ZWRMb2NhbGUsXHJcbiAgICAgICAgICAgIHNoYWxsb3c6IHRydWUgLy8gRG9uJ3QgdHJpZ2dlciBnZXRTZXJ2ZXJTaWRlUHJvcHMgYWdhaW5cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sIFtyb3V0ZXIubG9jYWxlLCByb3V0ZXIuYXNQYXRoLCBtb3VudGVkXSk7XHJcblxyXG4gIC8vIFNjcmlwdCBkJ2luaXRpYWxpc2F0aW9uIGR1IG1vZGUgc29tYnJlXHJcbiAgcmV0dXJuIChcclxuICAgIDw+XHJcbiAgICAgIDxIZWFkPlxyXG4gICAgICAgIDxzY3JpcHRcclxuICAgICAgICAgIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7XHJcbiAgICAgICAgICAgIF9faHRtbDogYFxyXG4gICAgICAgICAgICAgIChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIC8vIE9uIGV4w6ljdXRlIGNlIHNjcmlwdCBpbW3DqWRpYXRlbWVudCBwb3VyIMOpdml0ZXIgbGUgZmxhc2ggZGUgY29udGVudSBibGFuY1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgdmFyIHNhdmVkVGhlbWUgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndGhlbWUnKTtcclxuICAgICAgICAgICAgICAgICAgdmFyIHByZWZlcnNEYXJrID0gd2luZG93Lm1hdGNoTWVkaWEoJyhwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyayknKS5tYXRjaGVzO1xyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgaWYgKHNhdmVkVGhlbWUgPT09ICdkYXJrJyB8fCAoIXNhdmVkVGhlbWUgJiYgcHJlZmVyc0RhcmspKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2RhcmsnKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBpbml0aWFsaXplIGRhcmsgbW9kZScsIGVycik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSkoKTtcclxuICAgICAgICAgICAgYCxcclxuICAgICAgICAgIH19XHJcbiAgICAgICAgLz5cclxuICAgICAgPC9IZWFkPlxyXG4gICAgICA8U2Vzc2lvblByb3ZpZGVyIHNlc3Npb249e3BhZ2VQcm9wcy5zZXNzaW9ufT5cclxuICAgICAgICA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IC8+XHJcbiAgICAgIDwvU2Vzc2lvblByb3ZpZGVyPlxyXG4gICAgPC8+XHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXBwV2l0aFRyYW5zbGF0aW9uKE15QXBwKTsiXSwibmFtZXMiOlsiU2Vzc2lvblByb3ZpZGVyIiwiYXBwV2l0aFRyYW5zbGF0aW9uIiwidXNlUm91dGVyIiwidXNlRWZmZWN0IiwidXNlU3RhdGUiLCJIZWFkIiwiTXlBcHAiLCJDb21wb25lbnQiLCJwYWdlUHJvcHMiLCJyb3V0ZXIiLCJsb2FkaW5nIiwic2V0TG9hZGluZyIsIm1vdW50ZWQiLCJzZXRNb3VudGVkIiwiaW5pdERhcmtNb2RlIiwic2F2ZWRUaGVtZSIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJwcmVmZXJzRGFyayIsIndpbmRvdyIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwiZG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJjbGFzc0xpc3QiLCJhZGQiLCJyZW1vdmUiLCJoYW5kbGVTdGFydCIsInVybCIsImluY2x1ZGVzIiwicGF0aG5hbWUiLCJhc1BhdGgiLCJoYW5kbGVDb21wbGV0ZSIsImV2ZW50cyIsIm9uIiwib2ZmIiwiaGFzRGV0ZWN0ZWRMYW5ndWFnZSIsInNlc3Npb25TdG9yYWdlIiwic2V0SXRlbSIsImJyb3dzZXJMYW5ndWFnZSIsIm5hdmlnYXRvciIsImxhbmd1YWdlIiwidXNlckxhbmd1YWdlIiwiZGV0ZWN0ZWRMb2NhbGUiLCJzdGFydHNXaXRoIiwibG9jYWxlIiwic2VwYXJhdG9yIiwicmVkaXJlY3RQYXRoIiwicmVwbGFjZSIsInNoYWxsb3ciLCJzY3JpcHQiLCJkYW5nZXJvdXNseVNldElubmVySFRNTCIsIl9faHRtbCIsInNlc3Npb24iXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "next-auth/react":
/*!**********************************!*\
  !*** external "next-auth/react" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("next-auth/react");

/***/ }),

/***/ "next-i18next":
/*!*******************************!*\
  !*** external "next-i18next" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = require("next-i18next");

/***/ }),

/***/ "next/head":
/*!****************************!*\
  !*** external "next/head" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/head");

/***/ }),

/***/ "next/router":
/*!******************************!*\
  !*** external "next/router" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/router");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./pages/_app.js"));
module.exports = __webpack_exports__;

})();