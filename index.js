const core = require('@actions/core');

const fs = require('fs');
const path = require('path');

async function run() {
    let defaultData = null;
    let backupData = {};
    const languageData = {};
    const oldLangData = {};
    const editableExist = {};

    try {
        const basePath = core.getInput('base-path');
        const langFilesPath = path.join(basePath, core.getInput('lang-files-path'));
        const editablePath = path.join(basePath, core.getInput('editable-files-path'));
        const fileSuffix = core.getInput('end-with');
        const editableSuffix = core.getInput('editable-suffix');
        const backupSuffix = core.getInput('backup-suffix');
        const defaultName = core.getInput('default-language');

        const updatePathFiles = (targetPath) => {
            const isEditablePath = targetPath == editablePath;
            for (const pathName of fs.readdirSync(targetPath)) {
                if (!pathName.endsWith(fileSuffix)) return;
                
                let finalizeName = pathName.substring(0, pathName.length - fileSuffix.length);
                
                const isEditable = finalizeName.endsWith(editableSuffix);
                if (isEditable) finalizeName = finalizeName.substring(0, finalizeName.length - editableSuffix.length);
                
                const isBackup = finalizeName.endsWith(backupSuffix);
                if (isBackup) finalizeName = finalizeName.substring(0, finalizeName.length - backupSuffix.length);
        
                const isDefault = !isBackup && finalizeName == defaultName;
        
                core.info(`found '${pathName}'. (editable: ${isEditable}, default: ${isDefault}, backup: ${isBackup})`);
    
                core.info(`reading '${pathName}'...`);
                const langData = JSON.parse(fs.readFileSync(path.join(targetPath, pathName), 'utf8'));
                core.info(`read '${pathName}' json. lang keys: ${Object.keys(langData).length}`);
    
                if (isDefault && !isEditablePath) {
                    defaultData = langData;
                } else if (isBackup && !isEditablePath) {
                    backupData = langData;
                } else {
                    if (editableExist[finalizeName] == undefined) editableExist[finalizeName] = false;
                    
                    if (isEditable == isEditablePath) continue;

                    if (isEditable) {
                        languageData[finalizeName] = langData;
                        editableExist[finalizeName] = true;
                    } else {
                        oldLangData[finalizeName] = langData;
                    }
                }
            }
        }
    
        core.info('loading lang files...');
        updatePathFiles(langFilesPath);
        updatePathFiles(editablePath);
        core.info(`loaded ${pathFiles.length} lang files.`);

        if (!defaultData) {
            core.setFailed('Failed to load default lang file.');
            return;
        }
        
        core.info('done with reading lang files, try updating...');

        for (const [langName, exist] of Object.entries(editableExist)) {
            if (!oldLangData[langName]) {
                core.setFailed(`The language file for '${langName}' could not be found.`);
                return;
            }

            const resultData = {};

            core.info(`start updating '${langName}'...`);

            if (!exist) {
                languageData[langName] = JSON.parse(JSON.stringify(defaultData));
                core.info(`'${langName}' editable file wasn't exist, it will create new editable file.`);

                // init old strings
                for (const [key, value] of Object.entries(oldLangData[langName])) {
                    const defaultValue = defaultData[key];
                    if (defaultValue) {
                        languageData[langName][key] = value;
                    }
                }
            }

            // update strings
            for (const [key, value] of Object.entries(languageData[langName])) {
                const defaultValue = defaultData[key];
                const oldValue = backupData[key];

                if (defaultValue) {
                    // check same value
                    if (defaultValue == value) continue;

                    // check outdated original value
                    if (oldValue && defaultValue != oldValue) {
                        languageData[langName][key] = defaultValue;
                        continue;
                    }
                } else if (oldValue) {
                    // check deleted original value
                    languageData[langName][key] = undefined;
                    continue;
                }

                resultData[key] = value;
            }
            
            fs.writeFileSync(path.join(langFilesPath, langName + fileSuffix), JSON.stringify(resultData, null, 4), 'utf8');
            fs.writeFileSync(path.join(editablePath, langName + editableSuffix + fileSuffix), JSON.stringify(languageData[langName], null, 4), 'utf8');
            core.info(`done with update '${langName}'.`);
        }

        core.info(`backup old default strings...`);
        fs.writeFileSync(path.join(langFilesPath, defaultName + backupSuffix + fileSuffix), JSON.stringify(defaultData, null, 4), 'utf8');
        core.info(`done with backup default strings.`);

        core.info(`complete!`);
    } catch (error) {
        core.setFailed(error.message);
    }


}

run();