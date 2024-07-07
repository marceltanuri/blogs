const gulp = require('gulp');
const htmlBeautify = require('gulp-html-beautify');
const gulpData = require('gulp-data');
const tap = require('gulp-tap');
const fs = require('fs');
const path = require('path');
const rename = require('gulp-rename');

const getMarkdown = async () => {
    const markdown = await import('gulp-markdown');
    return markdown.default;
};

const readMetadata = (metadataPath) => {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    return metadata;
};


// Task para converter Markdown em HTML com metadados
gulp.task('markdownToHtml', async function() {
    const markdown = await getMarkdown();
    return gulp.src('src/**/*.md')
        .pipe(gulpData(function(file) {
            const metadataPath = path.join(path.dirname(file.path), 'metadata.json');
            const metadata = fs.existsSync(metadataPath) ? readMetadata(metadataPath) : {};
            return metadata;
        }))
        .pipe(markdown())
        .pipe(tap(function(file) {
            const metadata = file.data;
            const htmlContent = file.contents.toString();
            const htmlWithMetadata = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${metadata.title || 'Untitled'}</title>
                    <meta name="description" content="${metadata.summary || ''}">
                    <meta name="author" content="${metadata.author || ''}">
                    <meta name="keywords" content="${(metadata.tags || []).join(', ')}">
                    <link rel="canonical" href="${metadata.url || ''}">
                </head>
                <body>
                    <nav>
                        <ul>
                            ${(metadata.categories || []).map(category => `<li>${category}</li>`).join('')}
                        </ul>
                    </nav>
                    <article>
                        ${htmlContent}
                    </article>
                </body>
                </html>
            `;
            file.contents = Buffer.from(htmlWithMetadata, 'utf-8');
        }))
        .pipe(htmlBeautify({ indent_size: 2 }))
        .pipe(rename(function (filePath) {
            filePath.extname = '.html';
        }))
        .pipe(gulp.dest(function (file) {
            return path.join('dist', path.dirname(file.relative));
        }));
});

// Task para copiar imagens
gulp.task('copyImages', function() {
    return gulp.src('src/**/images/**/*')
        .pipe(gulp.dest(function(file) {
            return path.join('dist', path.dirname(file.relative));
        }));
});

// Task padrão
gulp.task('default', gulp.series('markdownToHtml', 'copyImages'));
