#!/usr/bin/env node

/**
 * Validate specs.md memory-bank structure, references, indexes, and timestamps.
 * Paths come from the installed memory-bank schema; a different memory-bank root
 * can be supplied for isolated validation and tests.
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const colors = {
    reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
    blue: '\x1b[34m', dim: '\x1b[90m', bright: '\x1b[1m'
};

const DEFAULT_SCHEMA_PATH = path.join(__dirname, '..', 'memory-bank.yaml');
const TIMESTAMP_FIELDS = new Set([
    'created', 'updated', 'started', 'completed', 'timestamp', 'last_updated'
]);
const patterns = {
    intent: /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/,
    unit: /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/,
    story: /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/,
    bolt: /^\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/,
    timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
    timestampMilliseconds: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/
};

function extractFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    if (!match) return null;
    return yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
}

function updateFrontmatter(content, frontmatter) {
    const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    if (!match) return null;
    const newYaml = yaml.dump(frontmatter, {
        lineWidth: -1, noRefs: true, quotingType: '"', forceQuotes: false, sortKeys: false
    }).trim();
    return `---\n${newYaml}\n---${content.slice(match[0].length)}`;
}

function isRealCanonicalTimestamp(value) {
    if (!patterns.timestamp.test(value)) return false;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().replace(/\.000Z$/, 'Z') === value;
}

function isWithin(root, candidate) {
    const relative = path.relative(path.resolve(root), path.resolve(candidate));
    return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function formatFieldPath(segments) {
    return segments.reduce((result, segment) =>
        typeof segment === 'number' ? `${result}[${segment}]` : (result ? `${result}.${segment}` : segment), '');
}

function fieldValueAt(root, fieldPath) {
    const segments = fieldPath.match(/[^.\[\]]+/g) || [];
    let value = root;
    for (const segment of segments) {
        if (value === null || value === undefined || !Object.hasOwn(value, segment)) {
            return { exists: false, value: undefined };
        }
        value = value[segment];
    }
    return { exists: true, value };
}

function isTimestampFieldPath(fieldPath) {
    const segments = fieldPath.match(/[^.\[\]]+/g) || [];
    const leaf = segments.at(-1);
    return typeof leaf === 'string' && (TIMESTAMP_FIELDS.has(leaf) || leaf.endsWith('_at'));
}

class ArtifactValidator {
    constructor(memoryBankPath = 'memory-bank', options = {}) {
        if (typeof memoryBankPath === 'object' && memoryBankPath !== null) {
            options = memoryBankPath;
            memoryBankPath = options.memoryBankPath || 'memory-bank';
        }
        this.memoryBankPath = path.resolve(memoryBankPath);
        this.schemaPath = path.resolve(options.schemaPath || DEFAULT_SCHEMA_PATH);
        this.quiet = options.quiet === true;
        this.results = [];
        this.fixCount = 0;
        this.timestampRequirements = new Map();
        this.schemaConfig = yaml.load(fs.readFileSync(this.schemaPath, 'utf8'), {
            schema: yaml.JSON_SCHEMA
        });
        this.paths = {
            intents: this.resolveSchemaPath('intents'),
            bolts: this.resolveSchemaPath('bolts'),
            storyIndex: this.resolveSchemaPath('story-index'),
            decisionIndex: this.resolveSchemaPath('decision-index')
        };
    }

    resolveSchemaPath(key, values = {}) {
        const template = this.schemaConfig?.schema?.[key];
        if (typeof template !== 'string') {
            throw new Error(`memory-bank schema is missing schema.${key}`);
        }
        let relative = template.replace(/^memory-bank\/?/, '');
        for (const [name, value] of Object.entries(values)) {
            relative = relative.replaceAll(`{${name}}`, value);
        }
        relative = relative.replace(/\{[^}]+\}\/?/g, '');
        return path.join(this.memoryBankPath, relative);
    }

    log(message = '') {
        if (!this.quiet) console.log(message);
    }

    addResult(result) {
        this.results.push(result);
    }

    async directoriesAt(dir) {
        if (!await fs.pathExists(dir)) return [];
        return (await fs.readdir(dir, { withFileTypes: true }))
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
    }

    async markdownFilesAt(dir) {
        if (!await fs.pathExists(dir)) return [];
        return (await fs.readdir(dir, { withFileTypes: true }))
            .filter(entry => entry.isFile() && path.extname(entry.name) === '.md')
            .map(entry => entry.name);
    }

    async readFrontmatter(file) {
        const content = await fs.readFile(file, 'utf8');
        try {
            return { content, frontmatter: extractFrontmatter(content) };
        } catch (error) {
            this.addResult({
                type: 'format', severity: 'error', file, rule: 'frontmatter.valid-yaml',
                message: `Invalid YAML frontmatter: ${error.message}`, fixable: false
            });
            return { content, frontmatter: null };
        }
    }

    async scanStories() {
        const stories = [];
        for (const intent of await this.directoriesAt(this.paths.intents)) {
            const unitsDir = this.resolveSchemaPath('units', { 'intent-name': intent });
            for (const unit of await this.directoriesAt(unitsDir)) {
                const storiesDir = this.resolveSchemaPath('stories', {
                    'intent-name': intent, 'unit-name': unit
                });
                for (const filename of await this.markdownFilesAt(storiesDir)) {
                    stories.push({ intent, unit, filename, file: path.join(storiesDir, filename) });
                }
            }
        }
        return stories;
    }

    async scanBolts() {
        const bolts = [];
        for (const dir of await this.directoriesAt(this.paths.bolts)) {
            const file = path.join(this.paths.bolts, dir, 'bolt.md');
            if (!await fs.pathExists(file)) continue;
            const { frontmatter } = await this.readFrontmatter(file);
            if (frontmatter) bolts.push({ dir, file, frontmatter });
        }
        return bolts;
    }

    async validateNamingConventions() {
        this.log(`${colors.dim}[1/6] Validating naming conventions...${colors.reset}`);
        for (const dir of await this.directoriesAt(this.paths.intents)) {
            if (!patterns.intent.test(dir)) this.addResult({
                type: 'naming', severity: 'error', file: path.join(this.paths.intents, dir),
                rule: 'intent.folder-pattern', message: `Intent folder "${dir}" is not a three-digit kebab-case name`,
                fixable: false
            });
            const unitsDir = this.resolveSchemaPath('units', { 'intent-name': dir });
            for (const unit of await this.directoriesAt(unitsDir)) {
                if (!patterns.unit.test(unit)) this.addResult({
                    type: 'naming', severity: 'error', file: path.join(unitsDir, unit),
                    rule: 'unit.folder-pattern', message: `Unit folder "${unit}" is not a three-digit kebab-case name`,
                    fixable: false
                });
                const storiesDir = this.resolveSchemaPath('stories', {
                    'intent-name': dir, 'unit-name': unit
                });
                for (const story of await this.markdownFilesAt(storiesDir)) {
                    if (!patterns.story.test(path.basename(story, '.md'))) this.addResult({
                        type: 'naming', severity: 'error', file: path.join(storiesDir, story),
                        rule: 'story.file-pattern', message: `Story file "${story}" is not a three-digit kebab-case name`,
                        fixable: false
                    });
                }
            }
        }
        for (const dir of await this.directoriesAt(this.paths.bolts)) {
            if (!patterns.bolt.test(dir)) this.addResult({
                type: 'naming', severity: 'error', file: path.join(this.paths.bolts, dir),
                rule: 'bolt.folder-pattern', message: `Bolt folder "${dir}" is not a three-digit kebab-case name`,
                fixable: false
            });
        }
    }

    async validateIdFilenameConsistency() {
        this.log(`${colors.dim}[2/6] Validating ID-filename consistency...${colors.reset}`);
        for (const story of await this.scanStories()) {
            const { frontmatter } = await this.readFrontmatter(story.file);
            if (!frontmatter?.id) continue;
            const expected = path.basename(story.filename, '.md');
            if (frontmatter.id !== expected) this.addResult({
                type: 'consistency', severity: 'error', file: story.file,
                rule: 'story.id-matches-filename', message: `Story id "${frontmatter.id}" doesn't match filename "${story.filename}"`,
                expected, actual: frontmatter.id, fixable: true
            });
        }
        for (const bolt of await this.scanBolts()) {
            if (bolt.frontmatter.id && bolt.frontmatter.id !== bolt.dir) this.addResult({
                type: 'consistency', severity: 'error', file: bolt.file,
                rule: 'bolt.id-matches-folder', message: `Bolt id "${bolt.frontmatter.id}" doesn't match folder "${bolt.dir}/"`,
                expected: bolt.dir, actual: bolt.frontmatter.id, fixable: true
            });
        }
    }

    async validateCrossReferences() {
        this.log(`${colors.dim}[3/6] Validating scoped cross-references...${colors.reset}`);
        const bolts = await this.scanBolts();
        const boltsById = new Map(bolts.map(bolt => [bolt.frontmatter.id || bolt.dir, bolt]));
        for (const bolt of bolts) {
            const { intent, unit } = bolt.frontmatter;
            const intentPath = typeof intent === 'string' ? path.join(this.paths.intents, intent) : null;
            const unitPath = intentPath && typeof unit === 'string' ? this.resolveSchemaPath('units', {
                'intent-name': intent, 'unit-name': unit
            }) : null;
            if (!intentPath || !await fs.pathExists(intentPath)) this.addResult({
                type: 'reference', severity: 'error', file: bolt.file, rule: 'bolt.intent-exists',
                message: `Bolt references non-existent intent "${String(intent)}"`, reference: intent,
                expectedPath: intentPath, fixable: false
            });
            if (!unitPath || !await fs.pathExists(unitPath)) this.addResult({
                type: 'reference', severity: 'error', file: bolt.file, rule: 'bolt.unit-exists',
                message: `Bolt references non-existent unit "${String(unit)}" in intent "${String(intent)}"`,
                reference: unit, expectedPath: unitPath, fixable: false
            });
            for (const storyId of Array.isArray(bolt.frontmatter.stories) ? bolt.frontmatter.stories : []) {
                const storyPath = unitPath ? path.join(this.resolveSchemaPath('stories', {
                    'intent-name': intent, 'unit-name': unit
                }), `${storyId}.md`) : null;
                if (!storyPath || !await fs.pathExists(storyPath)) {
                    this.addResult({
                        type: 'reference', severity: 'error', file: bolt.file, rule: 'bolt.story-exists',
                        message: `Bolt references non-existent story "${storyId}" in ${String(intent)}/${String(unit)}`,
                        reference: storyId, expectedPath: storyPath, fixable: false
                    });
                    continue;
                }
                const { frontmatter } = await this.readFrontmatter(storyPath);
                if (frontmatter &&
                    ((frontmatter.intent && frontmatter.intent !== intent) ||
                     (frontmatter.unit && frontmatter.unit !== unit))) this.addResult({
                    type: 'reference', severity: 'error', file: storyPath, rule: 'story.scope-matches-bolt',
                    message: `Story scope ${String(frontmatter.intent)}/${String(frontmatter.unit)} doesn't match bolt scope ${intent}/${unit}`,
                    reference: bolt.frontmatter.id || bolt.dir, fixable: false
                });
            }
        }
        for (const story of await this.scanStories()) {
            const { frontmatter } = await this.readFrontmatter(story.file);
            if (!frontmatter) continue;
            if ((frontmatter.intent && frontmatter.intent !== story.intent) ||
                (frontmatter.unit && frontmatter.unit !== story.unit)) this.addResult({
                type: 'reference', severity: 'error', file: story.file, rule: 'story.scope-matches-path',
                message: `Story scope ${String(frontmatter.intent)}/${String(frontmatter.unit)} doesn't match path scope ${story.intent}/${story.unit}`,
                fixable: false
            });
            if (!frontmatter.assigned_bolt) continue;
            const bolt = boltsById.get(frontmatter.assigned_bolt);
            const storyId = path.basename(story.filename, '.md');
            if (!bolt) this.addResult({
                type: 'reference', severity: 'error', file: story.file, rule: 'story.assigned-bolt-exists',
                message: `Story references non-existent assigned bolt "${frontmatter.assigned_bolt}"`,
                reference: frontmatter.assigned_bolt, fixable: false
            });
            else if (bolt.frontmatter.intent !== story.intent || bolt.frontmatter.unit !== story.unit ||
                     !(bolt.frontmatter.stories || []).includes(storyId)) this.addResult({
                type: 'reference', severity: 'error', file: story.file, rule: 'story.assigned-bolt-membership',
                message: `Assigned bolt "${frontmatter.assigned_bolt}" does not include this story in ${story.intent}/${story.unit}`,
                reference: frontmatter.assigned_bolt, fixable: false
            });
        }
    }

    resolveStoryIndexReference(reference, intent) {
        const normalized = reference.replaceAll('\\', '/').replace(/^\.\//, '');
        if (normalized.startsWith('memory-bank/')) return path.join(this.memoryBankPath, normalized.slice('memory-bank/'.length));
        if (normalized.startsWith('intents/')) return path.join(this.memoryBankPath, normalized);
        if (!intent) return null;
        return path.join(this.resolveSchemaPath('units', { 'intent-name': intent }), normalized);
    }

    async validateIndexes() {
        this.log(`${colors.dim}[4/6] Validating canonical index membership...${colors.reset}`);
        const storyIndex = this.schemaConfig['story-index'];
        if (storyIndex?.enabled !== false && storyIndex?.mode !== 'aggregate') await this.validateStoryIndex();
        await this.validateDecisionIndex();
    }

    async validateStoryIndex() {
        const index = this.paths.storyIndex;
        if (!await fs.pathExists(index)) {
            this.addResult({ type: 'index', severity: 'error', file: index, rule: 'story-index.exists',
                message: 'Canonical story index is missing', fixable: false });
            return;
        }
        const content = await fs.readFile(index, 'utf8');
        const counts = new Map();
        let intent = null;
        let unit = null;
        for (const line of content.split(/\r?\n/)) {
            const heading = line.match(/^## (\d{3}-.+)\s*$/);
            if (heading) {
                intent = heading[1].trim();
                unit = null;
            }
            const unitHeading = line.match(/^### (\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*)(?::|\s*$)/);
            if (unitHeading) unit = unitHeading[1];
            for (const match of line.matchAll(/`([^`]*\/stories\/[^`]+\.md)`/g)) {
                const resolved = this.resolveStoryIndexReference(match[1], intent);
                if (!resolved || !isWithin(this.memoryBankPath, resolved)) {
                    this.addResult({ type: 'index', severity: 'error', file: index, rule: 'story-index.safe-reference',
                        message: `Story index reference escapes or lacks intent scope: "${match[1]}"`, reference: match[1], fixable: false });
                    continue;
                }
                const intentUnits = intent ? this.resolveSchemaPath('units', { 'intent-name': intent }) : null;
                const relativeToUnits = intentUnits ? path.relative(intentUnits, resolved) : null;
                const referencedUnit = relativeToUnits?.split(path.sep)[0];
                if (!intentUnits || !isWithin(intentUnits, resolved) || (unit && referencedUnit !== unit)) {
                    this.addResult({
                        type: 'index', severity: 'error', file: index, rule: 'story-index.scope-reference',
                        message: `Story index reference "${match[1]}" is outside heading scope ${String(intent)}/${String(unit)}`,
                        reference: match[1], fixable: false
                    });
                    continue;
                }
                const absolute = path.resolve(resolved);
                counts.set(absolute, (counts.get(absolute) || 0) + 1);
                if (!await fs.pathExists(resolved)) this.addResult({
                    type: 'index', severity: 'error', file: index, rule: 'story-index.reference-exists',
                    message: `Story index references non-existent file "${match[1]}"`, reference: match[1], expectedPath: resolved, fixable: false
                });
            }
        }
        for (const [file, count] of counts) {
            if (count > 1) this.addResult({ type: 'index', severity: 'error', file: index, rule: 'story-index.unique-membership',
                message: `Story is listed ${count} times: ${path.relative(this.memoryBankPath, file)}`, reference: file, fixable: false });
        }
        for (const story of await this.scanStories()) {
            if ((counts.get(path.resolve(story.file)) || 0) === 0) this.addResult({
                type: 'index', severity: 'error', file: story.file, rule: 'story-index.membership',
                message: 'Story is missing from the canonical story index', expectedPath: index, fixable: false
            });
        }
    }

    async validateDecisionIndex() {
        const index = this.paths.decisionIndex;
        if (!await fs.pathExists(index)) {
            this.addResult({ type: 'index', severity: 'error', file: index, rule: 'decision-index.exists',
                message: 'Canonical decision index is missing', fixable: false });
            return;
        }
        const content = await fs.readFile(index, 'utf8');
        const indexFrontmatter = extractFrontmatter(content);
        const counts = new Map();
        let headingId = null;
        for (const line of content.split(/\r?\n/)) {
            const heading = line.match(/^### (ADR-\d+):/);
            if (heading) headingId = heading[1];
            for (const match of line.matchAll(/`((?:memory-bank\/)?bolts\/[^`]+\/adr-[^`]+\.md)`/g)) {
                const relative = match[1].replace(/^memory-bank\//, '');
                const resolved = path.join(this.memoryBankPath, relative);
                if (!isWithin(this.memoryBankPath, resolved)) {
                    this.addResult({ type: 'index', severity: 'error', file: index, rule: 'decision-index.safe-reference',
                        message: `Decision index reference escapes memory bank: "${match[1]}"`, reference: match[1], fixable: false });
                    continue;
                }
                const absolute = path.resolve(resolved);
                counts.set(absolute, (counts.get(absolute) || 0) + 1);
                if (!await fs.pathExists(resolved)) this.addResult({ type: 'index', severity: 'error', file: index,
                    rule: 'decision-index.reference-exists', message: `Decision index references non-existent file "${match[1]}"`,
                    reference: match[1], expectedPath: resolved, fixable: false });
                else {
                    const filenameId = path.basename(resolved).match(/^adr-(\d+)-/)?.[1];
                    const expectedId = filenameId ? `ADR-${filenameId}` : null;
                    const { frontmatter } = await this.readFrontmatter(resolved);
                    if (!headingId || headingId !== expectedId || (frontmatter?.id && frontmatter.id !== expectedId)) {
                        this.addResult({
                            type: 'index', severity: 'error', file: index, rule: 'decision-index.identity',
                            message: `Decision heading ${String(headingId)}, path identity ${String(expectedId)}, and artifact id ${String(frontmatter?.id)} must agree`,
                            reference: match[1], fixable: false
                        });
                    }
                }
            }
        }
        for (const [file, count] of counts) {
            if (count > 1) this.addResult({
                type: 'index', severity: 'error', file: index, rule: 'decision-index.unique-membership',
                message: `ADR is listed ${count} times: ${path.relative(this.memoryBankPath, file)}`,
                reference: file, fixable: false
            });
        }
        let decisionCount = 0;
        for (const bolt of await this.directoriesAt(this.paths.bolts)) {
            const boltDir = path.join(this.paths.bolts, bolt);
            for (const filename of await this.markdownFilesAt(boltDir)) {
                if (!/^adr-.*\.md$/.test(filename)) continue;
                decisionCount++;
                const file = path.join(boltDir, filename);
                if ((counts.get(path.resolve(file)) || 0) === 0) this.addResult({
                    type: 'index', severity: 'error', file, rule: 'decision-index.membership',
                    message: 'ADR is missing from the canonical decision index', expectedPath: index, fixable: false
                });
            }
        }
        if (indexFrontmatter?.total_decisions !== decisionCount) this.addResult({
            type: 'index', severity: 'error', file: index, rule: 'decision-index.total-decisions',
            message: `Decision index total_decisions is ${String(indexFrontmatter?.total_decisions)} but ${decisionCount} ADR files exist`,
            expected: decisionCount, actual: indexFrontmatter?.total_decisions, fixable: false
        });
    }

    async validateChronology() {
        this.log(`${colors.dim}[5/6] Validating bolt chronology...${colors.reset}`);
        for (const bolt of await this.scanBolts()) {
            const completed = bolt.frontmatter.completed;
            const completedTime = typeof completed === 'string' ? Date.parse(completed) : Number.NaN;
            if (bolt.frontmatter.status !== 'complete') continue;
            this.requireTimestamp(bolt.file, 'completed');

            const stages = Array.isArray(bolt.frontmatter.stages_completed)
                ? bolt.frontmatter.stages_completed : [];
            let hasLegacyStageNames = false;
            for (const [index, stage] of stages.entries()) {
                if (typeof stage === 'string') {
                    hasLegacyStageNames = true;
                    continue;
                }
                this.requireTimestamp(bolt.file, `stages_completed[${index}].completed`);
                if (!stage || typeof stage.artifact !== 'string' || !stage.artifact.endsWith('.md')) continue;
                const artifactPath = path.join(path.dirname(bolt.file), stage.artifact);
                if (!isWithin(path.dirname(bolt.file), artifactPath) || !await fs.pathExists(artifactPath)) continue;
                const { frontmatter } = await this.readFrontmatter(artifactPath);
                if (!frontmatter) continue;
                if (Object.hasOwn(frontmatter, 'created')) this.requireTimestamp(artifactPath, 'created');
            }
            if (hasLegacyStageNames) this.addResult({
                type: 'chronology', severity: 'warning', file: bolt.file,
                rule: 'bolt.legacy-stage-chronology-unavailable',
                message: 'Legacy name-only stages record completion without timestamps, so stage chronology cannot be checked',
                fixable: false
            });
            const completedStages = stages.filter(stage =>
                stage && typeof stage.completed === 'string' && !Number.isNaN(Date.parse(stage.completed))
            );
            const lastCompletedTime = Math.max(...completedStages.map(stage => Date.parse(stage.completed)));
            if (!Number.isNaN(completedTime) && completedStages.length > 0 && completedTime < lastCompletedTime) this.addResult({
                type: 'chronology', severity: 'error', file: bolt.file,
                rule: 'bolt.completed-after-stages',
                message: `Bolt completed timestamp "${completed}" predates its latest completed stage`,
                value: completed, fixable: false
            });

            const finalStage = stages.at(-1);
            if (finalStage?.name !== 'test' || typeof finalStage.artifact !== 'string') continue;
            const reportPath = path.join(path.dirname(bolt.file), finalStage.artifact);
            if (!isWithin(path.dirname(bolt.file), reportPath) || !await fs.pathExists(reportPath)) continue;
            const { frontmatter } = await this.readFrontmatter(reportPath);
            const reportField = frontmatter && Object.hasOwn(frontmatter, 'created') ? 'created' : null;
            const reportCreated = reportField ? frontmatter.created : undefined;
            const reportCreatedTime = typeof reportCreated === 'string' ? Date.parse(reportCreated) : Number.NaN;
            if (!Number.isNaN(reportCreatedTime) && completedTime < reportCreatedTime) this.addResult({
                type: 'chronology', severity: 'error', file: reportPath,
                rule: 'bolt.completed-after-test-report',
                message: `Bolt completed timestamp "${completed}" predates referenced test report ${reportField} timestamp "${reportCreated}"`,
                value: reportCreated, reference: bolt.file, fixable: false
            });
        }
    }

    requireTimestamp(file, field) {
        const absolute = path.resolve(file);
        if (!this.timestampRequirements.has(absolute)) this.timestampRequirements.set(absolute, new Set());
        this.timestampRequirements.get(absolute).add(field);
    }

    validateTimestampProvenance(frontmatter, file) {
        const required = this.timestampRequirements.get(path.resolve(file)) || new Set();
        const rawEntries = frontmatter.timestamp_provenance;
        const entries = rawEntries === undefined ? [] : rawEntries;
        if (!Array.isArray(entries)) {
            this.addResult({
                type: 'format', severity: 'error', file, rule: 'timestamp.provenance-shape',
                message: 'timestamp_provenance must be an array', fixable: false
            });
        }
        const usableEntries = Array.isArray(entries) ? entries : [];
        const byField = new Map();
        for (const entry of usableEntries) {
            const valid = entry && typeof entry === 'object' &&
                typeof entry.field === 'string' && entry.state === 'unknown' &&
                typeof entry.original_value === 'string' && entry.original_value.length > 0 &&
                typeof entry.evidence_commit === 'string' && /^[0-9a-f]{40}$/i.test(entry.evidence_commit) &&
                typeof entry.evidence_committed_at === 'string' && isRealCanonicalTimestamp(entry.evidence_committed_at) &&
                typeof entry.reason === 'string' && entry.reason.trim().length > 0;
            if (!valid) this.addResult({
                type: 'format', severity: 'error', file, rule: 'timestamp.provenance-shape',
                message: 'Historical timestamp provenance requires field, state: unknown, original_value, full evidence_commit, canonical evidence_committed_at, and reason',
                fixable: false
            });
            if (typeof entry?.field !== 'string') continue;
            if (!byField.has(entry.field)) byField.set(entry.field, []);
            byField.get(entry.field).push({ entry, valid });
            const target = fieldValueAt(frontmatter, entry.field);
            if (!isTimestampFieldPath(entry.field)) this.addResult({
                type: 'format', severity: 'error', file, rule: 'timestamp.provenance-unused',
                message: `Timestamp provenance target "${entry.field}" is not a timestamp field`,
                fieldPath: entry.field, fixable: false
            });
            else if (!target.exists) this.addResult({
                type: 'format', severity: 'error', file, rule: 'timestamp.provenance-missing-target',
                message: `Timestamp provenance target "${entry.field}" does not exist`,
                fieldPath: entry.field, fixable: false
            });
            else if (target.value !== null) this.addResult({
                type: 'format', severity: 'error', file, rule: 'timestamp.provenance-null-target',
                message: `Timestamp provenance target "${entry.field}" must exist and be null`,
                fieldPath: entry.field, fixable: false
            });
        }
        for (const [field, matching] of byField) {
            if (matching.length > 1) this.addResult({
                type: 'format', severity: 'error', file, rule: 'timestamp.provenance-duplicate',
                message: `Timestamp provenance field "${field}" must have exactly one entry`,
                fieldPath: field, fixable: false
            });
        }
        for (const field of required) {
            const target = fieldValueAt(frontmatter, field);
            if (target.exists && target.value !== null && target.value !== undefined) continue;
            const matching = byField.get(field) || [];
            if (!target.exists || target.value !== null || matching.length !== 1 || !matching[0].valid) {
                this.addResult({
                    type: 'format', severity: 'error', file, rule: 'timestamp.required-or-provenanced',
                    message: `Required timestamp "${field}" must be canonical or null with exactly one valid historical provenance entry`,
                    fieldPath: field, fixable: false
                });
            }
        }
    }

    validateTimestampValue(value, key, file, fieldPath) {
        if (typeof value === 'string' && isRealCanonicalTimestamp(value)) return;
        const milliseconds = typeof value === 'string' && patterns.timestampMilliseconds.test(value);
        this.addResult({
            type: 'format', severity: milliseconds ? 'warning' : 'error', file,
            rule: milliseconds ? 'timestamp.no-milliseconds' : 'timestamp.iso8601',
            message: milliseconds
                ? `Timestamp "${value}" has historical millisecond precision; canonical form omits milliseconds`
                : `Timestamp field "${formatFieldPath(fieldPath)}" must be a real YYYY-MM-DDTHH:MM:SSZ value (received ${JSON.stringify(value)})`,
            field: key, fieldPath, value, fixable: milliseconds
        });
    }

    walkTimestampFields(value, file, fieldPath = []) {
        if (Array.isArray(value)) {
            value.forEach((item, index) => this.walkTimestampFields(item, file, [...fieldPath, index]));
            return;
        }
        if (!value || typeof value !== 'object') return;
        for (const [key, child] of Object.entries(value)) {
            const childPath = [...fieldPath, key];
            if (TIMESTAMP_FIELDS.has(key) || key.endsWith('_at')) {
                if (child !== null && child !== undefined) this.validateTimestampValue(child, key, file, childPath);
            }
            if (Array.isArray(child) || (child && typeof child === 'object')) this.walkTimestampFields(child, file, childPath);
        }
    }

    async validateTimestamps() {
        this.log(`${colors.dim}[6/6] Validating timestamp formats...${colors.reset}`);
        const visit = async dir => {
            if (!await fs.pathExists(dir)) return;
            for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
                const file = path.join(dir, entry.name);
                if (entry.isDirectory()) await visit(file);
                else if (entry.isFile() && path.extname(entry.name) === '.md') {
                    const { frontmatter } = await this.readFrontmatter(file);
                    if (frontmatter) {
                        this.validateTimestampProvenance(frontmatter, file);
                        this.walkTimestampFields(frontmatter, file);
                    }
                }
            }
        };
        await visit(this.memoryBankPath);
    }

    async validateAll() {
        this.results = [];
        this.timestampRequirements = new Map();
        this.log(`${colors.bright}${colors.blue}Artifact Validator${colors.reset}`);
        await this.validateNamingConventions();
        await this.validateIdFilenameConsistency();
        await this.validateCrossReferences();
        await this.validateIndexes();
        await this.validateChronology();
        await this.validateTimestamps();
        return { totalIssues: this.results.length, results: this.results };
    }

    setAtPath(root, fieldPath, value) {
        let target = root;
        for (const segment of fieldPath.slice(0, -1)) target = target[segment];
        target[fieldPath.at(-1)] = value;
    }

    async fixSafeIssues() {
        let fixed = 0;
        for (const result of [...this.results]) {
            if (!result.fixable) continue;
            const { content, frontmatter } = await this.readFrontmatter(result.file);
            if (!frontmatter) continue;
            if (result.rule === 'story.id-matches-filename' || result.rule === 'bolt.id-matches-folder') frontmatter.id = result.expected;
            else if (result.rule === 'timestamp.no-milliseconds') {
                this.setAtPath(frontmatter, result.fieldPath, result.value.replace(/\.\d+Z$/, 'Z'));
            } else continue;
            const updated = updateFrontmatter(content, frontmatter);
            if (updated !== null) {
                await fs.writeFile(result.file, updated, 'utf8');
                fixed++;
            }
        }
        this.fixCount += fixed;
        return fixed;
    }

    toConsole() {
        const errors = this.results.filter(result => result.severity === 'error').length;
        const warnings = this.results.filter(result => result.severity === 'warning').length;
        if (this.results.length === 0) this.log(`${colors.green}✓ All validations passed!${colors.reset}`);
        for (const issue of this.results) {
            const icon = issue.severity === 'error' ? `${colors.red}✗` : `${colors.yellow}⚠`;
            this.log(`${icon}${colors.reset} ${path.relative(process.cwd(), issue.file)}: ${issue.message}`);
        }
        this.log(`Total issues: ${this.results.length} (${errors} errors, ${warnings} warnings); fixed: ${this.fixCount}`);
    }

    toJSON() {
        return JSON.stringify({
            summary: {
                total: this.results.length,
                errors: this.results.filter(result => result.severity === 'error').length,
                warnings: this.results.filter(result => result.severity === 'warning').length,
                fixed: this.fixCount
            }, results: this.results
        }, null, 2);
    }
}

function optionValue(args, name) {
    const index = args.indexOf(name);
    if (index === -1) return undefined;
    if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`${name} requires a path`);
    return args[index + 1];
}

async function main(args = process.argv.slice(2)) {
    const jsonOutput = args.includes('--json');
    const shouldFix = args.includes('--fix');
    const validator = new ArtifactValidator(optionValue(args, '--memory-bank') || 'memory-bank', {
        schemaPath: optionValue(args, '--schema'), quiet: jsonOutput
    });
    await validator.validateAll();
    if (shouldFix) {
        await validator.fixSafeIssues();
        await validator.validateAll();
    }
    if (jsonOutput) console.log(validator.toJSON());
    else validator.toConsole();
    return validator.results.some(result => result.severity === 'error') ? 1 : 0;
}

if (require.main === module) {
    main().then(code => process.exit(code)).catch(error => {
        console.error(`${colors.red}Error:${colors.reset}`, error.message);
        process.exit(1);
    });
}

module.exports = ArtifactValidator;
module.exports.main = main;
module.exports.extractFrontmatter = extractFrontmatter;
