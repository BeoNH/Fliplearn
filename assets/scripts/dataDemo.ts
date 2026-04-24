import { CardType } from "./common/GameTypes";

export const apiGameInfo = {
    gameId: 8386,
    title: "GameDemo",
    description: "Hiển thị nội dung về thông tin, mô tả, luật chơi game\n   • Trường hợp user chọn chơi theo chủ đề, nội dung mô tả sẽ là mô tả về chủ đề\n   • Hỗ trợ đa ngôn ngữ"
};

export const apiPlay = [
    {
        levelId: 1,
        hasTimeLimit: false,
        timeLimit: 60,
        rows: 4,
        cols: 3,
        pairs: [
            {
                cardA: { cardId: 'c1a', pairId: 'p1', type: CardType.TEXT, content: 'Hello', image: '' },
                cardB: { cardId: 'c1b', pairId: 'p1', type: CardType.DEFINITION, content: 'Xin chào', image: 'https://cdn.gamebatta.com/astrobot-4721/van_lich_ava.png' },
            },
            {
                cardA: { cardId: 'c2a', pairId: 'p2', type: CardType.TEXT, content: 'Apple', image: '' },
                cardB: { cardId: 'c2b', pairId: 'p2', type: CardType.IMAGE, content: 'Quả táo', image: 'https://cdn.gamebatta.com/astrobot-4721/minh_giap_ava.png' },
            },
            {
                cardA: { cardId: 'c3a', pairId: 'p3', type: CardType.TEXT, content: 'Cat', image: '' },
                cardB: { cardId: 'c3b', pairId: 'p3', type: CardType.TEXT, content: 'Con mèo', image: '' },
            },
            {
                cardA: { cardId: 'c4a', pairId: 'p4', type: CardType.TEXT, content: 'Sun', image: '' },
                cardB: { cardId: 'c4b', pairId: 'p4', type: CardType.TEXT, content: 'Mặt trời', image: '' },
            },
            {
                cardA: { cardId: 'c5a', pairId: 'p5', type: CardType.TEXT, content: 'Book', image: '' },
                cardB: { cardId: 'c5b', pairId: 'p5', type: CardType.TEXT, content: 'Quyển sách', image: '' },
            },
            {
                cardA: { cardId: 'c6a', pairId: 'p6', type: CardType.TEXT, content: 'Car', image: '' },
                cardB: { cardId: 'c6b', pairId: 'p6', type: CardType.TEXT, content: 'Xe hơi', image: '' },
            },
        ]
    },

    {
        levelId: 2,
        hasTimeLimit: true,
        timeLimit: 80,
        rows: 5,
        cols: 4,
        pairs: [
            {
                cardA: { cardId: 'c7a', pairId: 'p7', type: CardType.TEXT, content: 'Dog', image: '' },
                cardB: { cardId: 'c7b', pairId: 'p7', type: CardType.TEXT, content: 'Con chó', image: '' },
            },
            {
                cardA: { cardId: 'c8a', pairId: 'p8', type: CardType.TEXT, content: 'Tree', image: '' },
                cardB: { cardId: 'c8b', pairId: 'p8', type: CardType.TEXT, content: 'Cái cây', image: '' },
            },
            {
                cardA: { cardId: 'c9a', pairId: 'p9', type: CardType.TEXT, content: 'Milk', image: '' },
                cardB: { cardId: 'c9b', pairId: 'p9', type: CardType.TEXT, content: 'Sữa', image: '' },
            },
            {
                cardA: { cardId: 'c10a', pairId: 'p10', type: CardType.TEXT, content: 'House', image: '' },
                cardB: { cardId: 'c10b', pairId: 'p10', type: CardType.TEXT, content: 'Ngôi nhà', image: '' },
            },
            {
                cardA: { cardId: 'c11a', pairId: 'p11', type: CardType.TEXT, content: 'Water', image: '' },
                cardB: { cardId: 'c11b', pairId: 'p11', type: CardType.TEXT, content: 'Nước', image: '' },
            },
            {
                cardA: { cardId: 'c12a', pairId: 'p12', type: CardType.TEXT, content: 'Fire', image: '' },
                cardB: { cardId: 'c12b', pairId: 'p12', type: CardType.TEXT, content: 'Lửa', image: '' },
            },
            {
                cardA: { cardId: 'c13a', pairId: 'p13', type: CardType.TEXT, content: 'Fish', image: '' },
                cardB: { cardId: 'c13b', pairId: 'p13', type: CardType.TEXT, content: 'Con cá', image: '' },
            },
            {
                cardA: { cardId: 'c14a', pairId: 'p14', type: CardType.TEXT, content: 'Bird', image: '' },
                cardB: { cardId: 'c14b', pairId: 'p14', type: CardType.TEXT, content: 'Con chim', image: '' },
            },
            {
                cardA: { cardId: 'c15a', pairId: 'p15', type: CardType.TEXT, content: 'Sun', image: '' },
                cardB: { cardId: 'c15b', pairId: 'p15', type: CardType.TEXT, content: 'Mặt trời', image: '' },
            },
            {
                cardA: { cardId: 'c16a', pairId: 'p16', type: CardType.TEXT, content: 'Moon', image: '' },
                cardB: { cardId: 'c16b', pairId: 'p16', type: CardType.TEXT, content: 'Mặt trăng', image: '' },
            }
        ]
    }
];