# mc-lang-translation-action

A Github Action workflow for managing language files for Minecraft.

## How it works (Repository)
1. Read all language files(that name has end with value of `end-with`) from the selected directory(`base-path`).
2. If there is a default language file(`default-language`), all strings are saved to default language strings.
3. In other cases, the default language strings in the file containing the editable suffix(`editable-suffix`) are compared, and if they are different, they are regarded as changed strings and written to the language file.

If the default language file or the editable language file is updated, the editable language file and the language file are recreated.

So, if you want to add/edit/delete strings, you must be change only the default language file.
And if you want to translate(edit) the other language file, you must change the editable language file.

## How it works (Workflow)

It doesn't checkout or push commits, so it does only proceeds to edit files in workflow.

### Inputs
```yml
- use: RedLime/mc-lang-translation-action@v2
  with:
    # Required
    base-path: '/src/main/resources/assets/examplemod/lang'

    # The directory where language files expect editable language files are created/loaded. Based on `base-path`.
    # Not Required, Default: `lang-files-path: './'`
    lang-files-path: './'

    # The directory where editable language files are created/loaded. Based on `base-path`.
    # Not Required, Default: `editable-files-path: './'`
    editable-files-path: './editable' 

    # A filename suffix string to identify a language files in the `base-path` directory.
    # Not Required, Default: `end-with: '.json'`
    end-with: '.json'

    # To be inserted before value of `end-with` in the filename to identify the editable language file.
    # Example) `editable-suffix: '.editable'` will be make `*.editable.json` files to editable language files.
    # Not Required, Default: `editable-suffix: '.editable'`
    editable-suffix: '.editable'

    # To be inserted before value of `end-with` in the filename to identify the backup language file.
    # Example) `backup-suffix: '.prev'` will be make `[default-language].prev.json` file to backup language file.
    # Not Required, Default: `backup-suffix: '.prev'`
    backup-suffix: '.prev'

    # A filename without `end-with` or `*-suffix` to identify the base language file.
    # Example) `default-language: 'en_us'` will be make `en_us.json` file to default language file.
    # Not Required, Default: `default-language: 'en_us'`
    default-language: 'en_us'
```
### Example
- [test.yml](/.github/workflows/test.yml)
- Another
```yml
on: 
  schedule:
    - cron: '0 0 0 * * *'

jobs:
  run_schedule:
    runs-on: ubuntu-latest
    if: ${{ github.repository_owner == 'RedLime' }}
    steps:
      - uses: actions/checkout@v3
      - name: work
        uses: RedLime/mc-lang-translation-action@v2
        with: 
          base-path: '/src/main/resources/assets/examplemod/lang'
          editable-suffix: '.TRANSLATE_ME'
          editable-files-path: './editable'
      - name: Commit update lang files
        uses: endbug/add-and-commit@v9
        with:
          add: '/src/main/resources/assets/examplemod/lang'
          message: 'chore: update lang files'
          default_author: github_actions
```
