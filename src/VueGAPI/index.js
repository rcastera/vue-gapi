import Vue from 'vue'
import { gapiPromise } from './gapi'
import GoogleAuthService from './GoogleAuthService'

const googleAuthService = new GoogleAuthService()
const { login, logout, isAuthenticated, getUserData } = googleAuthService
const rootVue = new Vue({})

export default {
  install: function (Vue, clientConfig) {
    Vue.gapiLoadClientPromise = null

    const resolveAuth2Client = (resolve, reject) => {
      gapiPromise.then(_ => {
        const gapi = window.gapi
        if (!gapi) {
          console.log('Failed to load GAPI!')
          return
        }
        if (!gapi.auth) {
          gapi.load('client:auth2', () => {
            Vue.gapiLoadClientPromise = gapi.client
              .init(clientConfig)
              .then(() => {
                googleAuthService.authInstance = gapi.auth2.getAuthInstance()

                // Listen for sign-in state changes.
                gapi.auth2.getAuthInstance().isSignedIn.listen(Vue.prototype.$getSignedInStatus)

                // Handle the initial sign-in state.
                Vue.prototype.$getSignedInStatus(gapi.auth2.getAuthInstance().isSignedIn.get())

                resolve(gapi)
              })
          })
        } else {
          resolve(gapi)
        }
      })
    }

    Vue.prototype.$getSignedInStatus = (isSignedIn) => {
      if (isSignedIn) {
        rootVue.$emit('signedIn', true)
      }
    }

    Vue.prototype.$getGapiClient = () => {
      return new Promise((resolve, reject) => {
        if (
          Vue.gapiLoadClientPromise &&
          Vue.gapiLoadClientPromise.status === 0
        ) {
          // promise is being executed
          resolve(Vue.gapiLoadClientPromise)
        } else {
          resolveAuth2Client(resolve, reject)
        }
      })
    }

    Vue.prototype.$login = () => {
      return Vue.prototype.$getGapiClient().then(login)
    }

    Vue.prototype.$logout = () => {
      return Vue.prototype.$getGapiClient().then(logout)
    }

    Vue.prototype.$isAuthenticated = isAuthenticated

    Vue.prototype.$getUserData = getUserData
  }
}
