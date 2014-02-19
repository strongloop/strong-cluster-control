// UI related utilities

module.exports = {
  humanizeDuration: humanizeDuration
};

function humanizeDuration(ms) {
  var s = Math.round(ms/1000);
  var m = Math.floor(s/60);
  var h = Math.floor(m/60);
  var d = Math.floor(h/24);
  var parts = [];
  if (d > 0) {
    parts.push(d + "d");
    h = h % 24;
  }
  if (h > 0) {
    parts.push(h + "h");
    m = m % 60;
  }
  if (m > 0) {
    parts.push(m + "m");
    s = s % 60;
  }
  if (s > 0) {
    parts.push(s + "s");
  }
  return parts.length > 0 ? parts.join(' ') : '0s';
}
