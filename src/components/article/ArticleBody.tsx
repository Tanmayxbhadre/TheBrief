import { Article } from '@/lib/types';
import styles from './ArticleBody.module.css';

interface ArticleBodyProps {
  article: Article;
}

/**
 * Renders article content.
 * In production, content would come from a rich-text CMS (Sanity, Contentful, etc.)
 * as structured data or portable text. For now, we parse simple markdown-style headings
 * from the content string into HTML elements.
 */
export default function ArticleBody({ article }: ArticleBodyProps) {
  const paragraphs = article.content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <div className="article-container">
      <div className={styles.body}>
        {paragraphs.map((para, i) => {
          if (para.startsWith('## ')) {
            return <h2 key={i} className={styles.h2}>{para.slice(3)}</h2>;
          }
          if (para.startsWith('### ')) {
            return <h3 key={i} className={styles.h3}>{para.slice(4)}</h3>;
          }
          if (para.startsWith('> ')) {
            return (
              <blockquote key={i} className={styles.blockquote}>
                {para.slice(2)}
              </blockquote>
            );
          }
          return <p key={i} className={styles.paragraph}>{para}</p>;
        })}

        {/* Sources */}
        {article.sources && article.sources.length > 0 && (
          <div className={styles.sources}>
            <h2 className={styles.sourcesHeading}>Sources</h2>
            <ul className={styles.sourceList}>
              {article.sources.map((source, i) => (
                <li key={i}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    {source.name} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className={styles.tags}>
            {article.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
