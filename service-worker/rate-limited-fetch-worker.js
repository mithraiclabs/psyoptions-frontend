const MS_DELAY = 250
let count = 0

const sleep = () => {
  count += 1
  const delay = MS_DELAY * count
  return new Promise((res) =>
    setTimeout(() => {
      // try to bring count back to 0
      count = Math.max(count - 1, 0)
      res()
    }, delay),
  )
}

const rateLimitedFetch = async (url, options = {}) => {
  // wait an amount of time that is based on how many
  // requests are yet to finish
  await sleep()
  return fetch(url, options)
}

// eslint-disable-next-line
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (
    url.host === 'devnet.solana.com' ||
    url.host === 'api.devnet.solana.com'
  ) {
    event.respondWith(
      rateLimitedFetch(event.request).then((response) => {
        return response
        // TODO: retry x number of times if !response
      }),
    )
  }
})

// eslint-disable-next-line
self.addEventListener('activate', (event) => {
  // eslint-disable-next-line
  event.waitUntil(clients.claim())
})
