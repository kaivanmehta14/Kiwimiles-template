export class CommonService {
    /** 
     * Accepts an array of an object and key column as arguments
     * and returns distinct elements
     */
    public static findUnique(arrayOfObjects: object[], keyColumn: string): object[]{
        const map = new Map();
        const distinctObjectsArray: object[] = [];
        arrayOfObjects.forEach(object => {
            const keyValue = object[keyColumn];
            if(!map.has(keyValue)){
                map.set(keyValue, true);
                distinctObjectsArray.push(object);
            }
        });
        return distinctObjectsArray;
    }
}
  