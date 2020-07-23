const ScryptaCore = require("@scrypta/core")
const ScryptaDB = require('./db')
import Locales from './locales'

export default {
    // Extract user data
    async auth() {
        return new Promise(async response => {
            const scrypta = new ScryptaCore(true)
            await scrypta.importBrowserSID()
            var wallet = await scrypta.returnDefaultIdentity()
            if (wallet.length > 0) {
                let SIDS = wallet.split(":")
                let identity = await scrypta.returnIdentity(SIDS[0])
                response(identity)
            } else {
                response(false)
            }
        })
    },
    // Extract user configs
    async configs() {
        return new Promise(async response => {
            const db = new ScryptaDB
            
            let language = await db.get('settings', 'set', 'language')
            if(!language){
                language = 'en'
                await db.put('settings', { set: 'language', value: 'en' })
            }else{
                language = language.value
            }

            let chain = await db.get('settings', 'set', 'chain')
            if(!chain){
                chain = 'LYRA'
                await db.put('settings', { set: 'chain', value: 'LYRA' })
            }else{
                chain = chain.value
            }

            response({
                chain: chain,
                language: language,
                locales: Locales[language]
            })
        })

    }
}
