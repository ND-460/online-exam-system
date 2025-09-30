const fs = require('fs');
const pdf = require('pdf-parse');
const natural = require('natural');
const path = require('path');

class PDFProcessor {
  async extractTextFromFile(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      
      switch (ext) {
        case '.pdf':
          return await this.extractTextFromPDF(filePath);
        case '.txt':
          return await this.extractTextFromTXT(filePath);
        case '.docx':
          return await this.extractTextFromDOCX(filePath);
        default:
          throw new Error(`Unsupported file format: ${ext}`);
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw error;
    }
  }

  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  async extractTextFromTXT(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error('Error reading TXT file:', error);
      throw new Error('Failed to read TXT file');
    }
  }

  async extractTextFromDOCX(filePath) {
    try {
      // For now, return a placeholder - would need mammoth or similar library for full DOCX support
      const buffer = fs.readFileSync(filePath);
      // Basic text extraction - in production, use mammoth.js or similar
      return "DOCX content extraction - please install mammoth library for full support";
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      throw new Error('Failed to extract text from DOCX file');
    }
  }

  extractKeywords(text, maxKeywords = 20) {
    try {
      // Clean and tokenize the text
      const tokenizer = new natural.WordTokenizer();
      const tokens = tokenizer.tokenize(text.toLowerCase());
      
      // Remove stop words and short words
      const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
        'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
      ]);

      const filteredTokens = tokens.filter(token => 
        token.length > 3 && 
        !stopWords.has(token) && 
        /^[a-zA-Z]+$/.test(token)
      );

      // Calculate frequency
      const frequency = {};
      filteredTokens.forEach(token => {
        frequency[token] = (frequency[token] || 0) + 1;
      });

      // Get top keywords by frequency
      const sortedKeywords = Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, maxKeywords)
        .map(([word]) => word);

      // Apply stemming to get root words
      const stemmedKeywords = sortedKeywords.map(word => natural.PorterStemmer.stem(word));
      
      // Remove duplicates and return unique keywords
      return [...new Set(stemmedKeywords)];
    } catch (error) {
      console.error('Error extracting keywords:', error);
      throw new Error('Failed to extract keywords from text');
    }
  }

  async processUploadedFile(filePath) {
    try {
      const text = await this.extractTextFromFile(filePath);
      const keywords = this.extractKeywords(text);
      
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      
      return {
        extractedText: text,
        keywords: keywords,
        wordCount: text.split(' ').length
      };
    } catch (error) {
      // Clean up file even if processing fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  // Keep backward compatibility
  async processUploadedPDF(filePath) {
    return this.processUploadedFile(filePath);
  }

  extractTopicFromText(text, maxLength = 100) {
    // Extract potential topic/subject from the beginning of the text
    const sentences = text.split(/[.!?]+/);
    const firstSentences = sentences.slice(0, 3).join('. ');
    
    if (firstSentences.length > maxLength) {
      return firstSentences.substring(0, maxLength) + '...';
    }
    
    return firstSentences;
  }
}

module.exports = new PDFProcessor();
