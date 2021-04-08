export class CommonService {

    /**
     * 
     * @param arrayOfObjects 
     * @param keyColumn 
     * @returns 
     * Accepts an array of an object and key column as arguments
     * and returns distinct elements
     * 
     */
    public static findUnique<T>(arrayOfObjects: T[], keyColumn: string): T[] {
        const map = new Map();
        const distinctObjectsArray: T[] = [];
        arrayOfObjects.forEach((object) => {
            const keyValue = object[keyColumn];
            if(!map.has(keyValue)){
                map.set(keyValue, true);
                distinctObjectsArray.push(object);
            }
        });
        return distinctObjectsArray;
    }
}
  