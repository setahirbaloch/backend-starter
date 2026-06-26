import fs from 'node:fs'
import path from 'node:path'

const ENV_PATH = path.resolve(process.cwd(), '.env')
const EXAMPLE_PATH = path.resolve(process.cwd(), '.env.example')

if (!fs.existsSync(ENV_PATH)) {
   throw new Error('.env file not found')
}

const envFile = fs.readFileSync(ENV_PATH, 'utf-8')

const example = envFile
   .split('\n')
   .map((line) => {
      const trimmed = line.trim()

      // keep comments & empty lines
      if (!trimmed || trimmed.startsWith('#')) {
         return line
      }

      const [key] = trimmed.split('=')
      return `${key}=`
   })
   .join('\n')

fs.writeFileSync(EXAMPLE_PATH, example)

console.log('✅ .env.example generated from .env')
