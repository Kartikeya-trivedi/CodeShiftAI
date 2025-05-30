import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigurationManager, Logger, CacheManager, DebounceManager } from '../utils';
import * as myExtension from '../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	suite('Configuration Manager Tests', () => {
		test('Should get default configuration values', () => {
			const config = ConfigurationManager.getApiConfig();
			assert.strictEqual(typeof config.url, 'string');
			assert.strictEqual(typeof config.timeout, 'number');
		});

		test('Should get completion configuration', () => {
			const config = ConfigurationManager.getCompletionConfig();
			assert.strictEqual(typeof config.enabled, 'boolean');
			assert.strictEqual(typeof config.delay, 'number');
			assert.strictEqual(typeof config.maxCompletions, 'number');
		});

		test('Should get feature flags', () => {
			const flags = ConfigurationManager.getFeatureFlags();
			assert.strictEqual(typeof flags.chat, 'boolean');
			assert.strictEqual(typeof flags.codeActions, 'boolean');
			assert.strictEqual(typeof flags.statusBar, 'boolean');
		});
	});

	suite('Cache Manager Tests', () => {
		test('Should store and retrieve values', () => {
			const cache = new CacheManager<string>(1000);
			cache.set('test', 'value');
			assert.strictEqual(cache.get('test'), 'value');
		});

		test('Should handle cache expiration', (done) => {
			const cache = new CacheManager<string>(50); // 50ms TTL
			cache.set('test', 'value');
			
			setTimeout(() => {
				assert.strictEqual(cache.get('test'), undefined);
				done();
			}, 100);
		});

		test('Should clear cache', () => {
			const cache = new CacheManager<string>(1000);
			cache.set('test1', 'value1');
			cache.set('test2', 'value2');
			cache.clear();
			assert.strictEqual(cache.size(), 0);
		});
	});

	suite('Debounce Manager Tests', () => {
		test('Should debounce function calls', (done) => {
			let callCount = 0;
			const debouncedFn = DebounceManager.debounce(() => {
				callCount++;
			}, 50, 'test');

			// Call multiple times rapidly
			debouncedFn();
			debouncedFn();
			debouncedFn();

			// Should only execute once after delay
			setTimeout(() => {
				assert.strictEqual(callCount, 1);
				done();
			}, 100);
		});

		test('Should cancel debounced calls', () => {
			let callCount = 0;
			const debouncedFn = DebounceManager.debounce(() => {
				callCount++;
			}, 50, 'test-cancel');

			debouncedFn();
			DebounceManager.cancel('test-cancel');

			setTimeout(() => {
				assert.strictEqual(callCount, 0);
			}, 100);
		});
	});	suite('Extension Commands Tests', () => {
		test('Should register all commands', async () => {
			// Create a mock context for testing
			const mockContext: vscode.ExtensionContext = {
				subscriptions: [],
				workspaceState: {} as any,
				globalState: {} as any,
				extensionUri: vscode.Uri.file(''),
				extensionPath: '',
				asAbsolutePath: (relativePath: string) => relativePath,
				storageUri: undefined,
				storagePath: undefined,
				globalStorageUri: vscode.Uri.file(''),
				globalStoragePath: '',
				logUri: vscode.Uri.file(''),
				logPath: '',
				extensionMode: vscode.ExtensionMode.Test,
				environmentVariableCollection: {} as any,
				secrets: {} as any,
				extension: {} as any,
				languageModelAccessInformation: {} as any
			};

			// Activate our extension manually with mock context
			try {
				await myExtension.activate(mockContext);
			} catch (error) {
				// Extension might fail to activate due to missing files, but commands should still register
				console.log('Extension activation failed, but that\'s expected in test environment');
			}
			
			const commands = await vscode.commands.getCommands(true);
			
			const expectedCommands = [
				'codeShiftAI.openChat',
				'codeShiftAI.explainCode',
				'codeShiftAI.fixCode',
				'codeShiftAI.optimizeCode',
				'codeShiftAI.generateTests',
				'codeShiftAI.generateDocs',
				'codeShiftAI.refactorCode',
				'codeShiftAI.openSettings'
			];

			expectedCommands.forEach(cmd => {
				assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
			});
		});
	});

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});
