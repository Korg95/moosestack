import * as ts_patch from 'ts-patch';
import ts from 'typescript';

declare const _default: (program: ts.Program, _configOrHost: ts_patch.PluginConfig | ts.CompilerHost | undefined, _extrasOrConfig: ts_patch.TransformerExtras | ts_patch.PluginConfig, maybeProgramExtras?: unknown) => ts.TransformerFactory<ts.SourceFile>;

export { _default as default };
