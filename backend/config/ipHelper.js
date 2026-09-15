/**
 * Helper to normalize client IP addresses (converting IPv6 loopback ::1 to clean 127.0.0.1)
 */
export function getClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || 
           req.socket?.remoteAddress || 
           req.connection?.remoteAddress || 
           req.ip || 
           '127.0.0.1';

  if (typeof ip === 'string') {
    // If multiple proxy IPs, pick first client IP
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    // Convert IPv6 loopback to friendly localhost IPv4
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1 (Localhost)';
    }
    // Strip ::ffff: prefix from IPv4 mapped IPv6
    if (ip.startsWith('::ffff:')) {
      return ip.replace('::ffff:', '');
    }
  }

  return ip;
}
