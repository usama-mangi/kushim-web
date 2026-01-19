import { Injectable } from '@nestjs/common';
import * as natural from 'natural';

@Injectable()
export class TfIdfService {
  private tokenizer = new natural.WordTokenizer();
  private stopwords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'this', 'they', 'their', 'them',
  ]);

  calculateSimilarity(textA: string, textB: string): number {
    if (!textA || !textB) return 0;

    const tfidf = new natural.TfIdf();
    tfidf.addDocument(this.preprocessText(textA));
    tfidf.addDocument(this.preprocessText(textB));

    const vectorA = this.getTfIdfVector(tfidf, 0);
    const vectorB = this.getTfIdfVector(tfidf, 1);

    return this.cosineSimilarity(vectorA, vectorB);
  }

  private preprocessText(text: string): string {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    if (!tokens) return '';
    
    const filtered = tokens
      .filter(token => 
        token.length > 2 && 
        !this.stopwords.has(token) &&
        /^[a-z0-9]+$/.test(token)
      );
    
    return filtered.join(' ');
  }

  private getTfIdfVector(tfidf: natural.TfIdf, docIndex: number): Map<string, number> {
    const vector = new Map<string, number>();
    
    tfidf.listTerms(docIndex).forEach(item => {
      vector.set(item.term, item.tfidf);
    });
    
    return vector;
  }

  private cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
    if (vecA.size === 0 || vecB.size === 0) return 0;

    const allTerms = new Set([...vecA.keys(), ...vecB.keys()]);
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (const term of allTerms) {
      const a = vecA.get(term) || 0;
      const b = vecB.get(term) || 0;
      
      dotProduct += a * b;
      magnitudeA += a * a;
      magnitudeB += b * b;
    }

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  }
}
