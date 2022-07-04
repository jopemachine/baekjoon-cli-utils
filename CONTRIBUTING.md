# CONTRIBUTING

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

## How to build project

```
$ npm run build
```

## How to run tests

```
$ npx ava
```

## How to implement new language test runner

- Implement`{new_lang}.ts` to `runner` folder inheriting `TestRunner` (copy and paste recommended).
- Add new lang support to `lang.ts`.
- Add new lang support to `test-runner-factory.ts`

## How to implement new service provider

TBD
