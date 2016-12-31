
const url = require('url')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const semver = require('semver')
const ROOT = path.join(execSync('npm root', { cwd: process.cwd() }).toString().replace('\n',''),'../')




function listPkgs(){
  const pkgPath = path.join(ROOT,'./package.json')
  if (!fs.existsSync(pkgPath)) {
    console.log(pkgPath)
    process.exit(0)
  }
  try {
    var pkgJson = JSON.parse(fs.readFileSync(pkgPath))
  } catch(e) {

  }
  let deps = pkgJson.dependencies
  if (deps) {

    console.log(
      Object.keys(deps).filter(function(key){
        return url.parse(deps[key]).host === "github.com"
      }).join("\n")
    )
  }
}

function GetPkgJson(rootPath, fastFail = true) {

  try {
    var pkgJson = JSON.parse(fs.readFileSync(rootPath,'utf-8'))
  } catch(e) {
    console.error(`checker-outer: Error parsing package.json`)
    if (fastFail) { throw new Error(e) }
    else { return null }
  }
  return pkgJson
}


function main2(){

  const ProjPkgPath = path.join(ROOT,'./package.json')

  try {
    var ProjPkgJson = JSON.parse(fs.readFileSync(ProjPkgPath,'utf-8'))
  } catch(e) {
    console.error(`checker-outer: Error parsing package.json`)
    throw new Error(e)
  }



  if (process.argv[2]){
    var pkgName = process.argv[2]
    if (typeof deps[pkgName] === "undefined") {
      let pkgPath = path.join(ROOT,pkgName)
      if (!fs.existsSync(pkgPath)) {
        throw new Error(`checker-outer: ${pkgPath} does not exist!`)
      } else {
        let pkgJson = getPkgJson(pkgPath,'./package.json')
        //Going with version number here .... is that right? or should we try the pkgJson repository url?
        repofy(pkgName, pkgJson.version)
      }
    }
    else {
      repofy(pkgName, deps[pkgName])
    }
  }
  else {
    for (let key in deps) {
      let pkgUrl = deps[key]
      repofy(key,pkgUrl)

    }
  }


}



function main(){

  const ProjPkgPath = path.join(process.cwd(),'./package.json')

  if (!fs.existsSync(ProjPkgPath)) {
    console.error(`checker-outer: ${pkgPath} does not exist!`)
    process.exit(1)
  }

  try {
    var ProjPkgJson = JSON.parse(fs.readFileSync(ProjPkgPath,'utf-8'))
  } catch(e) {
    console.error(`checker-outer: Error parsing package.json`)
    throw new Error(e)
  }

  let deps = ProjPkgJson.dependencies
  let newDeps = {}


  if (process.argv[2]){
    var pkgName = process.argv[2]
    if (typeof deps[pkgName] === "undefined") {
      console.error(`${pkgName} does not exist in ${pkgPath}`)
      process.exit(1)
    }
    else {
      repofy(pkgName, deps[pkgName])
    }
  }
  else {
    for (let key in deps) {
      let pkgUrl = deps[key]
      repofy(key,pkgUrl)

    }
  }
}


function getRepoUrl(repo) {

  if (repo === "undefined")  return false

  let repoUrl = (typeof repo === "string") ? repo : repo.url

  if (!isURL(repo)) return false

  return repo


}


function isURL(noun) {
  return (url.parse(noun).protocol !== null)
}

function isVER(noun) {
  return (semver.valid(noun) !== null)
}

function repofy(pkgName, pkgUrl) {




  let pkgRoot = path.join(ROOT,pkgName)

  let pkgJson = JSON.parse(fs.readFileSync(path.join(pkgRoot,'/package.json'),'utf-8'))

  let version = pkgJson.version 



  if (isURL(pkgUrl)) {
    checkoutUrl(pkgURL, pkgRoot)
  }
  else if (isVER(pkgURL)) {
    checkoutVerTag(pkgURL, pkgRoot)
  }

  else if (getRepoUrl(pkgJson.repository)) {

    let pkgRepo = pkgJson.repository
    let repoUrl = getRepoUrl(pkgRepo)
    let repoUrlObj = url.parse(repoUrl)

    if (pkgRepo.type && pkgRepo.type === "git") {
      repoUrlObj.protocol = 'git'
    } else {
      repoUrlObj.protocol = 'https'
    }

    checkoutURL(repoUrlObj.format())

  }

  else {
    throw new Error(`Could not figure this thing out, sorry`)
  }


}

function noop(){
  ;;
}

function checkoutUrl(target, root) {


  let urlObj = url.parse(target)

  if (urlObj.hash !== null) {
    var branch = urlObj.hash.replace("#","")
    urlObj.hash = null

  } else {
    var branch = 'master'
  }



  let commands = []

  //package is already a github repo, either created by this utility or the user
  if (fs.existsSync(path.join(root,'.git/config'))){



    commands = [

      //try to add a remote
      [`git remote add github ${newPkgUrl}`, noop],
      //try to fetch remote branch
      [`git fetch github ${branch}`, noop],
      //try to checkout branch - fail
      [`git checkout ${branch}`, fail]
    ]

  }
  else {

    commands = [
      [`git init .`, fail ],
      [`git checkout -b npm_${version}`, failRecover(`git checkout npm_${version}`, root)],
      [`git add -f .`, fail ],
      [`git commit -m "commit of current contents"`, fail],
      [`git remote add github ${newPkgUrl}`, noop],
      [`git fetch github ${branch}`, noop],
      [`git checkout ${branch}`, fail]
    ]


  }

  commandRunner(commands, root)
}


//Use semver here to first try to find the tag
//if you cannot find the tag find the one which satisfies semver
//Possibly use an object so root doesnt have to be passed around everywhere and state could be saved better :)
function checkoutVerTag(target, root){

  execSync(`git fetch --tags`, { cwd: root })
  let tag = execSync('git tag', { cwd: root }).toString().split("\n")
    .reduce(function(accum,nextVal){ 
      let ver = semver.clean(nextVal)
      if (semver.satisfies(ver,target)) { return nextVal } 
      else { 
        return accum
      } 
    }
      ,null)
  if (tag === null) {
    throw new Error(`Could not find tag which satisfies ${target}`)
  }
  execSync(`git checkout -b ${tag}`)

}


function commandRunner(commands, root, verbose = true) {

  for (let [cmd, failHandler] of commands) {
    if (typeof cmd !== "undefined") {
      try {
        let result = execSync(cmd, { cwd: root })
        if (verbose) console.log(result.toString())
      } catch(e) {
        failHandler(cmd, (e.stderr || e).toString())
      }
    }
  }
}


function fail(cmd, error, recover = false) {

  console.error(`ERROR: Command '${cmd}' failed:`, error)
  if (!recover) {
    console.error('No Recover ... finishing')
    process.exit(1)
  }

}

function failRecover(recoverCMD, cwd) {
  return function(){
    execSync(recoverCMD, { cwd })
  }
}


module.exports = { main, listPkgs }
