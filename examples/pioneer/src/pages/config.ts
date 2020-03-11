
const TAG = ' | Config | '
const VERSION = 1.0
var fs = require('fs-extra');
// @ts-ignore
import path from 'path';
import { app, remote } from 'electron';
// @ts-ignore
import os from 'os'
const mkdirp = require('mkdirp');

let appRootDir = require('app-root-dir').get().replace('app.asar', '').replace(/(\s+)/g, '\\$1');
export const rootDir = require('app-root-dir').get()

export const moneroNode = 'http://node.moneroworld.com:18089'
export const cosmosNode = ''
export const infuraNode = ''

//TODO this needs to be public repo to work!
export const releaseUrl = ''
export const downloadUrl = ''

//defaults

function getPlatform(){
  switch (os.platform()) {
    case 'aix':
    case 'freebsd':
    case 'linux':
    case 'openbsd':
    case 'android':
      return 'linux';
    case 'darwin':
    case 'sunos':
      return 'mac';
    case 'win32':
      return 'win';
  }
}

export const platform = getPlatform()

const IS_PROD = process.env.NODE_ENV === 'production';
//For bundling nodes
// const root = process.cwd();
const APP = process.type === 'renderer' ? remote.app : app

// const binariesPath =
//     IS_PROD || APP.isPackaged
//         ? path.join(process.resourcesPath, 'bin', platform)
//         : path.join(root, 'resources', 'bin', platform);


//Language Settings

export const  languageList = [
  'English',
  '简体中文', //Mandrin
  'русский', //Russian
  'español'  //Spanish
]

export const  languages = [
  {
    name:'English',
    code:'en',
    english:'English'
  },
  {
    name:'简体中文',
    code:'zh',
    english:'Chinese'
  },
  {
    name:'русский',
    code:'ru',
    english:'russian'
  },
  {
    name:'español',
    code:'es',
    english:'Spanish'
  }
]

export const foxPath = path.join(APP.getPath('home'), '.fox')
export const foxConfig = path.join(APP.getPath('home'), '.fox','fox.json')
export const configPath = path.join(APP.getPath('home'), '.fox','fox.json')
export const seedDir = path.join(APP.getPath('home'), '.fox', 'wallet_data')
export const seedPath = path.join(APP.getPath('home'), '.fox', 'wallet_data/wallet.seed')

//XMR not implemented
// export const seedPath = path.join(APP.getPath('home'), '.fox', 'wallet_data/wallet.seed')
// export const seedPathMonero = path.join(APP.getPath('home'), '.fox', 'wallet_data/monero/moneroWallet')
// export const seedDirMonero = path.join(APP.getPath('home'), '.fox', 'wallet_data/monero')

export const logDir = path.join(foxPath, 'log')


//innit
export function initConfig(languageSelected){
  let tag = TAG + ' | importConfig | '
  try{
    let output = {}
    console.log(tag,'CHECKPOINT innitConfig')
    console.log(tag,'foxPath: ',foxPath)
    console.log(tag,'seedDir: ',seedDir)

    mkdirp(foxPath, function (err) {
      if (err) console.error(err)
      else console.log('created: ',foxPath)
    });

    mkdirp(logDir, function (err) {
      if (err) console.error(err)
      else console.log('created: ',logDir)
    });

    mkdirp(seedDir, function (err) {
      if (err) console.error(err)
      else console.log('seedDir: ',seedDir)
    });


    console.log(tag,' innit config checkpiont 2')

    let config:any = {}
    config.locale = languageSelected.code
    config.localeSelected = true
    config.version = VERSION

    fs.writeFileSync(foxConfig,JSON.stringify(config))

  }catch (e) {
    console.error(tag,'e: ',e)
    return {}
  }
}


//innit Wallet
export function initWallet(encryptedSeed,passwordHash){
  let tag = TAG + ' | initWallet | '
  try{

    mkdirp(seedDir, function (err) {
      if (err) console.error(err)
      else console.log('seedDir: ',seedDir)

      let output = {}
      console.log(tag,'CHECKPOINT innitConfig')
      console.log(tag,'encryptedSeed: ',encryptedSeed)


      let wallet:any = {}
      wallet.hash = passwordHash
      wallet.version = 1
      wallet.type = 'seedwords'
      wallet.vault = encryptedSeed

      let result = fs.writeFileSync(seedPath,JSON.stringify(wallet))
      console.log('result: ',result)
    });



  }catch (e) {
    console.error(tag,'e: ',e)
    return {}
  }
}

//check
export function checkConfigs(){
  let output:any = {}
  output.isConfigured = false
  output.isWallet = false
  output.isRegistered = false

  let fileFound = fs.existsSync(foxConfig)?true:false
  if(fileFound){
    output.config = JSON.parse(fs.readFileSync(configPath))
    if(output.config.version) output.isConfigured = true
    if(output.config.username) output.isRegistered = true
  }


  if(output.config  && output.config.version )output.isConfigured = true

  //wallet found?
  let walletFound = fs.existsSync(seedPath)?true:false
  if(walletFound){
    output.isWallet = true
  }

  return output
}

/*
    Export CSV to file

 */
export function writeCsv(){
  try{
    //

  }catch (e) {
    return {}
  }
}


export function getWallet(){
  try{
    return fs.readFileSync(seedPath)
  }catch (e) {
    return {}
  }
}


export function getConfig(){
  try{
    let output = JSON.parse(fs.readFileSync(configPath))
    return output
  }catch (e) {
    return {}
  }
}

export function setConfig(options){
  return fs.writeFileSync(configPath, JSON.stringify(options))
}

export function updateConfig(options){
  let options_ = getConfig()
  for(var key in options){
    options_[key] = options[key]
  }
  setConfig(options_)
}

//export const logLevel = getConfig()['debug']?'debug':'info'
export const logLevel = 'debug'

export function getLocale(){
  let locale = getConfig()['locale']
  if(locale)return locale
  locale = APP.getLocale().toLowerCase()
  if(locale.startsWith('zh'))return 'zh'
  if(locale.startsWith('ru'))return 'ru'
  return 'en'
}

export function setLocale(locale){
  updateConfig({'locale':locale})
}
export const locale = getLocale()

// import pkg from './package.json'
// export const version = pkg.version
