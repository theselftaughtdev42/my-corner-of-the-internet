import type { APIRoute } from 'astro';
import { rssFeed } from '../lib/feeds';

export const GET: APIRoute = ({ site }) => rssFeed(site!, 'created');
