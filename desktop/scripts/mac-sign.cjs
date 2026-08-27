/**
 * electron-builder varsayılan yolda identity.name kullanıyor; “Ç” codesign’da bozuluyor.
 * buildSignOptions zaten identity.hash koyuyor — onu koruyup sign’a geçiriyoruz.
 */
module.exports = async function customMacSign(opts) {
  const { sign } = require('app-builder-lib/out/codeSign/macCodeSign');
  const hash =
    (typeof process.env.CSC_NAME === 'string' &&
    /^[0-9A-Fa-f]{40}$/.test(process.env.CSC_NAME.trim())
      ? process.env.CSC_NAME.trim()
      : null) ||
    (typeof opts.identity === 'string' && /^[0-9A-Fa-f]{40}$/.test(opts.identity)
      ? opts.identity
      : null) ||
    '412838A0CBDC36164BC57EC091E51EC7E7364604';
  return sign({ ...opts, identity: hash });
};
