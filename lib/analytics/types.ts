/**
 * Analytics event shapes, shared by the tracker in the browser, the /api/track
 * route and the private dashboard at /stats.
 *
 * Nothing personal is stored: no IP address, no name, no e-mail. A visitor is
 * a random id kept in the visitor's own browser; place comes from the
 * country and city Vercel derives at the edge.
 */

export type EventName =
  /** A page was opened. */
  | 'pageview'
  /** A section of the page came into view (once per page view). */
  | 'section'
  /** A link, button or tracked element was clicked. */
  | 'click'
  /** The reader passed 25, 50, 75 or 100% of the page. */
  | 'scroll'
  /** Something was done inside one of the live demos. */
  | 'demo'
  /** The page was left; `v` is the seconds it was actually in view. */
  | 'leave';

/** One event as the browser sends it. Short keys keep beacons small. */
export interface ClientEvent {
  n: EventName;
  /** Path the event happened on. */
  p: string;
  /** Label: the clicked text, the section id, the demo action. */
  l?: string;
  /** Link target, for clicks on links. */
  h?: string;
  /** Section the click happened in. */
  s?: string;
  /** A number: scroll percent, or seconds in view. */
  v?: number;
}

export interface ClientBatch {
  /** Visitor id, random, kept in localStorage. */
  vid: string;
  /** Visit id; a new visit starts after 30 minutes away. */
  sid: string;
  /** The ?ref= tag of a tracking link, first seen in this visit. */
  ref?: string;
  /** Where the visit came from: utm_source, else the referring host. */
  src?: string;
  /** Viewport width, to tell phones from desktops when the UA is vague. */
  w?: number;
  events: ClientEvent[];
}

/** An event as stored: the client fields plus what the server adds. */
export interface StoredEvent extends ClientEvent {
  vid: string;
  sid: string;
  ref?: string;
  src?: string;
  /** Server time, epoch ms. */
  at: number;
  country?: string;
  city?: string;
  device: 'Desktop' | 'Phone' | 'Tablet';
  browser: string;
}

export const EVENT_NAMES: EventName[] = ['pageview', 'section', 'click', 'scroll', 'demo', 'leave'];

/** The most events one day keeps, so storage stays inside Upstash's free plan. */
export const DAILY_CAP = 4000;
