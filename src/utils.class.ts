export default class Utils {
    static getRandomTileValue(): number {
        // value:probability
        const possibleValues: { [key: number]: number } = {
            2: 0.9,
            4: 0.1,
        };
    
        const probabilitiesSum = Object.values(possibleValues).reduce((a, b) => a + b, 0);
    
        let pick = Math.random() * probabilitiesSum;
    
        for (let i in possibleValues) {
            pick -= possibleValues[i];
    
            if (pick <= 0) {
                return Number(i);
            }
        }
    
        return possibleValues[Object.values(possibleValues)[0]];
    }
}