import { formatDistance } from 'date-fns';

export const ago = (timestamp) => {
  return formatDistance(new Date(timestamp), new Date())
    .replace(' days', 'd')
    .replace('less than a minute', 'just now')
    .replace(' minute', 'm');
};

export const fetcher = (...args) => fetch(...args).then(res => res.json());

export const getFetcher = async url => {
  const res = await fetch(url)

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    // Attach extra info to the error object.
    error.message = await res.json().message
    error.status = res.status
    throw error
  }

  return res.json()
}