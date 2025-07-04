import fs from 'fs/promises';
import path from 'path';
import { __dirname } from '../index.js';

export const delfile = async (file) => {
    try {
        if (path.resolve(__dirname, 'uploads', file)) {
            console.log('Deleted =>', file)
            await fs.unlink(path.resolve(__dirname, 'uploads', file));
        }else{
            console.log('File Not Found for Deletion =>',file);
        }
    }
    catch (error) {
        console.log(`Error in Deletion (MayBe Not Found in Storage)=>${file}\t\t\t${error}`);
    }
}