/**
 * French Bible Verses Database
 * Louis Segond 1910 Translation
 * 
 * Curated list of encouraging verses in French for Rhéma du Jour fallback
 */

export interface FrenchBibleVerse {
    reference: string;
    referenceFr: string;
    text: string;
    theme: string;
}

export const frenchBibleVerses: FrenchBibleVerse[] = [
    {
        reference: 'John 3:16',
        referenceFr: 'Jean 3:16',
        text: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu\'il ait la vie éternelle.',
        theme: 'Amour de Jésus'
    },
    {
        reference: 'John 14:6',
        referenceFr: 'Jean 14:6',
        text: 'Jésus lui dit: Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.',
        theme: 'Jésus le Chemin'
    },
    {
        reference: 'John 1:14',
        referenceFr: 'Jean 1:14',
        text: 'Et la parole a été faite chair, et elle a habité parmi nous, pleine de grâce et de vérité; et nous avons contemplé sa gloire, une gloire comme la gloire du Fils unique venu du Père.',
        theme: 'Incarnation'
    },
    {
        reference: 'Philippians 2:10-11',
        referenceFr: 'Philippiens 2:10-11',
        text: 'Afin qu\'au nom de Jésus tout genou fléchisse dans les cieux, sur la terre et sous la terre, et que toute langue confesse que Jésus Christ est Seigneur, à la gloire de Dieu le Père.',
        theme: 'Jésus Seigneur'
    },
    {
        reference: 'Hebrews 13:8',
        referenceFr: 'Hébreux 13:8',
        text: 'Jésus Christ est le même hier, aujourd\'hui, et éternellement.',
        theme: 'Jésus Immuable'
    },
    {
        reference: 'Matthew 11:28',
        referenceFr: 'Matthieu 11:28',
        text: 'Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.',
        theme: 'Repos en Jésus'
    },
    {
        reference: 'John 10:11',
        referenceFr: 'Jean 10:11',
        text: 'Je suis le bon berger. Le bon berger donne sa vie pour ses brebis.',
        theme: 'Jésus le Berger'
    },
    {
        reference: 'Colossians 1:15',
        referenceFr: 'Colossiens 1:15',
        text: 'Il est l\'image du Dieu invisible, le premier-né de toute la création.',
        theme: 'Image de Dieu'
    },
    {
        reference: 'John 11:25',
        referenceFr: 'Jean 11:25',
        text: 'Jésus lui dit: Je suis la résurrection et la vie. Celui qui croit en moi vivra, quand même il serait mort.',
        theme: 'Jésus la Vie'
    },
    {
        reference: 'Revelation 1:8',
        referenceFr: 'Apocalypse 1:8',
        text: 'Je suis l\'alpha et l\'oméga, dit le Seigneur Dieu, celui qui est, qui était, et qui vient, le Tout Puissant.',
        theme: 'Jésus Éternel'
    },
    {
        reference: 'Matthew 1:21',
        referenceFr: 'Matthieu 1:21',
        text: 'Elle enfantera un fils, et tu lui donneras le nom de Jésus; c\'est lui qui sauvera son peuple de ses péchés.',
        theme: 'Jésus Sauveur'
    },
    {
        reference: 'John 6:35',
        referenceFr: 'Jean 6:35',
        text: 'Jésus leur dit: Je suis le pain de vie. Celui qui vient à moi n\'aura jamais faim, et celui qui croit en moi n\'aura jamais soif.',
        theme: 'Pain de Vie'
    },
    {
        reference: 'Acts 4:12',
        referenceFr: 'Actes 4:12',
        text: 'Il n\'y a de salut en aucun autre; car il n\'y a sous le ciel aucun autre nom qui ait été donné parmi les hommes, par lequel nous devions être sauvés.',
        theme: 'Salut en Jésus'
    },
    {
        reference: 'Philippians 2:9',
        referenceFr: 'Philippiens 2:9',
        text: 'C\'est pourquoi aussi Dieu l\'a souverainement élevé, et lui a donné le nom qui est au-dessus de tout nom.',
        theme: 'Nom de Jésus'
    },
    {
        reference: 'John 8:12',
        referenceFr: 'Jean 8:12',
        text: 'Jésus leur parla de nouveau, et dit: Je suis la lumière du monde; celui qui me suit ne marchera pas dans les ténèbres, mais il aura la lumière de la vie.',
        theme: 'Lumière du Monde'
    },
    {
        reference: 'Colossians 2:9',
        referenceFr: 'Colossiens 2:9',
        text: 'Car en lui habite corporellement toute la plénitude de la divinité.',
        theme: 'Divinité de Jésus'
    },
    {
        reference: 'Matthew 28:20',
        referenceFr: 'Matthieu 28:20',
        text: 'Et voici, je suis avec vous tous les jours, jusqu\'à la fin du monde.',
        theme: 'Présence de Jésus'
    },
    {
        reference: '1 Timothy 2:5',
        referenceFr: '1 Timothée 2:5',
        text: 'Car il y a un seul Dieu, et aussi un seul médiateur entre Dieu et les hommes, Jésus Christ homme.',
        theme: 'Jésus Médiateur'
    },
    {
        reference: 'John 15:5',
        referenceFr: 'Jean 15:5',
        text: 'Je suis le cep, vous êtes les sarments. Celui qui demeure en moi et en qui je demeure porte beaucoup de fruit, car sans moi vous ne pouvez rien faire.',
        theme: 'Demeurer en Jésus'
    },
    {
        reference: 'Romans 8:34',
        referenceFr: 'Romains 8:34',
        text: 'Qui les condamnera? Christ est mort; bien plus, il est ressuscité, il est à la droite de Dieu, et il intercède pour nous!',
        theme: 'Intercession de Jésus'
    },
    {
        reference: 'Hebrews 4:15',
        referenceFr: 'Hébreux 4:15',
        text: 'Car nous n\'avons pas un souverain sacrificateur qui ne puisse compatir à nos faiblesses; au contraire, il a été tenté comme nous en toutes choses, sans commettre de péché.',
        theme: 'Compassion de Jésus'
    },
    {
        reference: 'Revelation 19:16',
        referenceFr: 'Apocalypse 19:16',
        text: 'Il avait sur son vêtement et sur sa cuisse un nom écrit: Roi des rois et Seigneur des seigneurs.',
        theme: 'Roi des Rois'
    },
    {
        reference: '1 Peter 2:24',
        referenceFr: '1 Pierre 2:24',
        text: 'Lui qui a porté lui-même nos péchés en son corps sur le bois, afin que morts aux péchés nous vivions pour la justice; lui par les meurtrissures duquel vous avez été guéris.',
        theme: 'Sacrifice de Jésus'
    },
    {
        reference: 'John 1:1',
        referenceFr: 'Jean 1:1',
        text: 'Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu.',
        theme: 'Jésus la Parole'
    },
    {
        reference: 'Ephesians 1:7',
        referenceFr: 'Éphésiens 1:7',
        text: 'En lui nous avons la rédemption par son sang, la rémission des péchés, selon la richesse de sa grâce.',
        theme: 'Rédemption en Jésus'
    }
];

/**
 * Get a deterministic French Bible verse for a given date.
 * Uses day-of-year to cycle through the list so the same day always returns the same verse.
 */
export const getDailyFrenchVerse = (dateStr?: string): FrenchBibleVerse => {
    const date = dateStr ? new Date(dateStr) : new Date();
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
    const index = dayOfYear % frenchBibleVerses.length;
    return frenchBibleVerses[index];
};

/**
 * Get a random French Bible verse (legacy fallback)
 */
export const getRandomFrenchVerse = (): FrenchBibleVerse => {
    const randomIndex = Math.floor(Math.random() * frenchBibleVerses.length);
    return frenchBibleVerses[randomIndex];
};

/**
 * Find a French verse by reference
 */
export const findFrenchVerse = (reference: string): FrenchBibleVerse | null => {
    return frenchBibleVerses.find(v =>
        v.reference.toLowerCase() === reference.toLowerCase() ||
        v.referenceFr.toLowerCase() === reference.toLowerCase()
    ) || null;
};
