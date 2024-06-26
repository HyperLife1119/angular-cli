/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import { execute } from '../../index';
import { BASE_OPTIONS, SERVER_BUILDER_INFO, describeBuilder } from '../setup';

describeBuilder(execute, SERVER_BUILDER_INFO, (harness) => {
  describe('Option: "assets"', () => {
    beforeEach(async () => {
      // Application code is not needed for asset tests
      await harness.writeFile('src/main.server.ts', '');
    });

    it('supports an empty array value', async () => {
      harness.useTarget('server', {
        ...BASE_OPTIONS,
        assets: [],
      });

      const { result } = await harness.executeOnce();

      expect(result?.success).toBeTrue();
    });

    it('supports mixing shorthand and longhand syntax', async () => {
      await harness.writeFile('src/files/test.svg', '<svg></svg>');
      await harness.writeFile('src/files/another.file', 'asset file');
      await harness.writeFile('src/extra.file', 'extra file');

      harness.useTarget('server', {
        ...BASE_OPTIONS,
        assets: ['src/extra.file', { glob: '*', input: 'src/files', output: '.' }],
      });

      const { result } = await harness.executeOnce();

      expect(result?.success).toBeTrue();

      harness.expectFile('dist/extra.file').content.toBe('extra file');
      harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
      harness.expectFile('dist/another.file').content.toBe('asset file');
    });

    describe('shorthand syntax', () => {
      it('copies a single asset', async () => {
        await harness.writeFile('src/test.svg', '<svg></svg>');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: ['src/test.svg'],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
      });

      it('copies multiple assets', async () => {
        await harness.writeFile('src/test.svg', '<svg></svg>');
        await harness.writeFile('src/another.file', 'asset file');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: ['src/test.svg', 'src/another.file'],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
        harness.expectFile('dist/another.file').content.toBe('asset file');
      });

      it('copies an asset with directory and maintains directory in output', async () => {
        await harness.writeFile('src/subdirectory/test.svg', '<svg></svg>');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: ['src/subdirectory/test.svg'],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/subdirectory/test.svg').content.toBe('<svg></svg>');
      });

      it('does not fail if asset does not exist', async () => {
        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: ['src/test.svg'],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').toNotExist();
      });

      it('fails if output option is not within project output path', async () => {
        await harness.writeFile('test.svg', '<svg></svg>');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: 'test.svg', input: 'src', output: '..' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.error).toMatch(
          'An asset cannot be written to a location outside of the output path',
        );

        harness.expectFile('dist/test.svg').toNotExist();
      });
    });

    describe('longhand syntax', () => {
      it('copies a single asset', async () => {
        await harness.writeFile('src/test.svg', '<svg></svg>');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: 'test.svg', input: 'src', output: '.' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
      });

      it('copies multiple assets as separate entries', async () => {
        await harness.writeFile('src/test.svg', '<svg></svg>');
        await harness.writeFile('src/another.file', 'asset file');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [
            { glob: 'test.svg', input: 'src', output: '.' },
            { glob: 'another.file', input: 'src', output: '.' },
          ],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
        harness.expectFile('dist/another.file').content.toBe('asset file');
      });

      it('copies multiple assets with a single entry glob pattern', async () => {
        await harness.writeFile('src/test.svg', '<svg></svg>');
        await harness.writeFile('src/another.file', 'asset file');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: '{test.svg,another.file}', input: 'src', output: '.' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
        harness.expectFile('dist/another.file').content.toBe('asset file');
      });

      it('copies multiple assets with a wildcard glob pattern', async () => {
        await harness.writeFile('src/files/test.svg', '<svg></svg>');
        await harness.writeFile('src/files/another.file', 'asset file');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: '*', input: 'src/files', output: '.' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
        harness.expectFile('dist/another.file').content.toBe('asset file');
      });

      it('copies multiple assets with a recursive wildcard glob pattern', async () => {
        await harness.writeFiles({
          'src/files/test.svg': '<svg></svg>',
          'src/files/another.file': 'asset file',
          'src/files/nested/extra.file': 'extra file',
        });

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: '**/*', input: 'src/files', output: '.' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
        harness.expectFile('dist/another.file').content.toBe('asset file');
        harness.expectFile('dist/nested/extra.file').content.toBe('extra file');
      });

      it('automatically ignores "." prefixed files when using wildcard glob pattern', async () => {
        await harness.writeFile('src/files/.gitkeep', '');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: '*', input: 'src/files', output: '.' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/.gitkeep').toNotExist();
      });

      it('supports ignoring a specific file when using a glob pattern', async () => {
        await harness.writeFiles({
          'src/files/test.svg': '<svg></svg>',
          'src/files/another.file': 'asset file',
          'src/files/nested/extra.file': 'extra file',
        });

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: '**/*', input: 'src/files', output: '.', ignore: ['another.file'] }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
        harness.expectFile('dist/another.file').toNotExist();
        harness.expectFile('dist/nested/extra.file').content.toBe('extra file');
      });

      it('supports ignoring with a glob pattern when using a glob pattern', async () => {
        await harness.writeFiles({
          'src/files/test.svg': '<svg></svg>',
          'src/files/another.file': 'asset file',
          'src/files/nested/extra.file': 'extra file',
        });

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: '**/*', input: 'src/files', output: '.', ignore: ['**/*.file'] }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
        harness.expectFile('dist/another.file').toNotExist();
        harness.expectFile('dist/nested/extra.file').toNotExist();
      });

      it('copies an asset with directory and maintains directory in output', async () => {
        await harness.writeFile('src/subdirectory/test.svg', '<svg></svg>');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: 'subdirectory/test.svg', input: 'src', output: '.' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/subdirectory/test.svg').content.toBe('<svg></svg>');
      });

      it('does not fail if asset does not exist', async () => {
        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: 'test.svg', input: 'src', output: '.' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').toNotExist();
      });

      it('uses project output path when output option is empty string', async () => {
        await harness.writeFile('src/test.svg', '<svg></svg>');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: 'test.svg', input: 'src', output: '' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
      });

      it('uses project output path when output option is "."', async () => {
        await harness.writeFile('src/test.svg', '<svg></svg>');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: 'test.svg', input: 'src', output: '.' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
      });

      it('uses project output path when output option is "/"', async () => {
        await harness.writeFile('src/test.svg', '<svg></svg>');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: 'test.svg', input: 'src', output: '/' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/test.svg').content.toBe('<svg></svg>');
      });

      it('creates a project output sub-path when output option path does not exist', async () => {
        await harness.writeFile('src/test.svg', '<svg></svg>');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: 'test.svg', input: 'src', output: 'subdirectory' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.success).toBeTrue();

        harness.expectFile('dist/subdirectory/test.svg').content.toBe('<svg></svg>');
      });

      it('fails if output option is not within project output path', async () => {
        await harness.writeFile('test.svg', '<svg></svg>');

        harness.useTarget('server', {
          ...BASE_OPTIONS,
          assets: [{ glob: 'test.svg', input: 'src', output: '..' }],
        });

        const { result } = await harness.executeOnce();

        expect(result?.error).toMatch(
          'An asset cannot be written to a location outside of the output path',
        );

        harness.expectFile('dist/test.svg').toNotExist();
      });
    });
  });
});
