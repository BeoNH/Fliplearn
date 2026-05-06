import { CardType } from "./common/GameTypes";

export const apiGameInfo = {
    gameId: 8386,
    title: "GameDemo",
    description: "Hiển thị nội dung về thông tin, mô tả, luật chơi game\n   • Trường hợp user chọn chơi theo chủ đề, nội dung mô tả sẽ là mô tả về chủ đề\n   • Hỗ trợ đa ngôn ngữ",
    introduction: "Luật chơi của game"
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
                cardB: { cardId: 'c1b', pairId: 'p1', type: CardType.DEFINITION, content: 'Xin chào', image: '' },
            },
            {
                cardA: { cardId: 'c2a', pairId: 'p2', type: CardType.TEXT, content: 'Apple', image: '' },
                cardB: { cardId: 'c2b', pairId: 'p2', type: CardType.IMAGE, content: 'Quả táo', image: '' },
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


// {
//     "success": true,
//     "code": 0,
//     "message": "Success",
//     "data": {
//         "gameSession": {
//             "session": "99a38a4f-0a58-4ef4-b9ae-088e0a61c186",
//             "sessionId": 15
//         },
//         "topic": {
//             "name": "Hello World",
//             "introduction": {
//                 "en": "Tiéng anh",
//                 "my": "tiếng myanmar",
//                 "vi": "Giới thiệu"
//             },
//             "options": {
//                 "levels": [
//                     {
//                         "duration": 30,
//                         "pairsLength": 3
//                     },
//                     {
//                         "duration": 30,
//                         "pairsLength": 4
//                     },
//                     {
//                         "duration": 30,
//                         "pairsLength": 5
//                     }
//                 ],
//                 "version": 1,
//                 "durationEnable": true
//             }
//         },
//         "pairs": [
//             {
//                 "pairAtext": "Cat",
//                 "pairBtext": {
//                     "en": "meow, meow, meow,meow",
//                     "my": "my lằn tờ ngoằn",
//                     "vi": "Mèo méo meo mèo meo"
//                 },
//                 "pairBimage": null,
//                 "bonusPoint": 5
//             },
//             {
//                 "pairAtext": "Cat 2",
//                 "pairBtext": {
//                     "en": "meow, meow, meow,meow 2",
//                     "my": "my lằn tờ ngoằn 2",
//                     "vi": "Mèo méo meo mèo meo 2"
//                 },
//                 "pairBimage": null,
//                 "bonusPoint": 5
//             },
//             {
//                 "pairAtext": "Cat 3",
//                 "pairBtext": {
//                     "en": "meow, meow, meow,meow 3",
//                     "my": "my lằn tờ ngoằn 3",
//                     "vi": "Mèo méo meo mèo meo 3"
//                 },
//                 "pairBimage": null,
//                 "bonusPoint": 5
//             }
//         ]
//     }
// }