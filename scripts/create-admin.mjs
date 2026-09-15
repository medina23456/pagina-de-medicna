import {randomBytes,pbkdf2Sync} from 'node:crypto';
import {existsSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
if(existsSync('.env.local')){console.log('Existing local credentials preserved.');process.exit(0)}
const password='MSJ-'+randomBytes(15).toString('base64url');
const salt=randomBytes(16).toString('hex');
const hash=pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex');
writeFileSync('.env.local',`ADMIN_INITIAL_HASH=${hash}\nADMIN_INITIAL_SALT=${salt}\n`);
writeFileSync('.dev.vars',`ADMIN_INITIAL_HASH=${hash}\nADMIN_INITIAL_SALT=${salt}\n`);
mkdirSync('outputs',{recursive:true});
writeFileSync('outputs/acceso-administrador.txt',`MEDICALSHOP JAÉN\n\nUsuario: admin\nContraseña inicial: ${password}\n\nAbre /admin e inicia sesión. Debes cambiar esta contraseña al ingresar.\nNo publiques ni compartas este archivo.\n`);
console.log('Initial admin generated. Credentials saved in outputs/acceso-administrador.txt.');
