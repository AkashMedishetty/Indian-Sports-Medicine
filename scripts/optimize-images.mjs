import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const folders = ['public/logos', 'public/ISSH', 'public/HYD', 'public/Favicons'];

async function optimizeImages() {
  for (const folder of folders) {
    const folderPath = path.join(process.cwd(), folder);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`Skipping ${folder} - doesn't exist`);
      continue;
    }

    const files = fs.readdirSync(folderPath);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const ext = path.extname(file).toLowerCase();
      
      if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;
      
      const stats = fs.statSync(filePath);
      const sizeBefore = stats.size;
      
      // Skip if already small (< 100KB)
      if (sizeBefore < 100 * 1024) {
        console.log(`✓ ${file} already optimized (${(sizeBefore/1024).toFixed(1)}KB)`);
        continue;
      }
      
      try {
        const image = sharp(filePath);
        const metadata = await image.metadata();
        
        // Resize if too large (max 800px for logos, 1200px for others)
        const maxSize = folder.includes('logos') ? 400 : 1200;
        let pipeline = image;
        
        if (metadata.width > maxSize || metadata.height > maxSize) {
          pipeline = pipeline.resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true });
        }
        
        // Optimize based on format
        if (ext === '.png') {
          pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
        } else {
          pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
        }
        
        const buffer = await pipeline.toBuffer();
        
        // Only save if smaller
        if (buffer.length < sizeBefore) {
          fs.writeFileSync(filePath, buffer);
          const sizeAfter = buffer.length;
          const savings = ((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(1);
          console.log(`✓ ${file}: ${(sizeBefore/1024).toFixed(1)}KB → ${(sizeAfter/1024).toFixed(1)}KB (${savings}% saved)`);
        } else {
          console.log(`- ${file}: Already optimal`);
        }
      } catch (err) {
        console.error(`✗ ${file}: ${err.message}`);
      }
    }
  }
}

optimizeImages().then(() => console.log('\nDone!'));
