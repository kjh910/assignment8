import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Podcast } from 'src/podcast/entities/podcast.entity';
import { Episode } from 'src/podcast/entities/episode.entity';

jest.mock('got', () => {
    return {
        post: jest.fn(),
    };
});

const createPodcast = {
    title:"testTitle",
    category:"testCategory"
}

const createEpisode = {
    title:"testEpisodeTitle",
    category:"testEpisodeCategory",
    podcastId:1
}

const updatePodcast = {
    title:"updateTitle",
    category:"updateCategory"
}

const updateEpisode = {
    title:"updateEpisodeTitle",
    category:"updateEpisodeCategory",
    podcastId:1
}

const GRAPHQL_ENDPOINT = '/graphql';

describe('PodcastsModule (e2e)', () => {
    let app: INestApplication;
    let podcastsRepository: Repository<Podcast>;
    let episodesRepository: Repository<Episode>;
  
    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = module.createNestApplication();
      podcastsRepository = module.get<Repository<Podcast>>(getRepositoryToken(Podcast));
      episodesRepository = module.get<Repository<Episode>>(getRepositoryToken(Episode));
      await app.init();
    });
  
    afterAll(async () => {
      // await getConnection().dropDatabase()
      app.close();
    });

    describe('createPodcast', () => {
        it('should create podcast', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              mutation {
                createPodcast(input: {
                    title:"${createPodcast.title}",
                    category:"${createPodcast.category}",
                }) {
                  ok
                  id
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
              expect(res.body.data.createPodcast.ok).toBe(true);
              expect(res.body.data.createPodcast.id).toBe(1);
            });
        });
    });

    describe('createEpisode', () => {
        it('should create episode', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              mutation {
                createEpisode(input: {
                    title:"${createEpisode.title}",
                    category:"${createEpisode.category}",
                    podcastId:${createEpisode.podcastId}
                }) {
                  ok
                  id
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
              expect(res.body.data.createEpisode.ok).toBe(true);
              expect(res.body.data.createEpisode.id).toBe(1);
            });
        })
    });

    describe('getAllPodcasts', () => {
        it('should get all podcasts', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              {
                getAllPodcasts{
                  ok
                  error
                  podcasts{
                    id
                    title
                    category
                  }
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { getAllPodcasts },
                    },
                } = res;
              expect(getAllPodcasts.ok).toBe(true);
              expect(getAllPodcasts.error).toBe(null);
              expect(getAllPodcasts.podcasts[0].id).toBe(1);
              expect(getAllPodcasts.podcasts[0].title).toBe(createPodcast.title);
              expect(getAllPodcasts.podcasts[0].category).toBe(createPodcast.category);
            });
        });
    });

    describe('getPodcast', () => {
        it('should get a podcast', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              {
                getPodcast(input:{
                    id:1
                }){
                  ok
                  error
                  podcast{
                    id
                    title
                    category
                  }
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { getPodcast },
                    },
                } = res;
              expect(getPodcast.ok).toBe(true);
              expect(getPodcast.error).toBe(null);
              expect(getPodcast.podcast.id).toBe(1);
              expect(getPodcast.podcast.title).toBe(createPodcast.title);
              expect(getPodcast.podcast.category).toBe(createPodcast.category);
            });
        });

        it('should not get a podcast', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              {
                getPodcast(input:{
                    id:666
                }){
                  ok
                  error
                  podcast{
                    id
                    title
                    category
                  }
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { getPodcast },
                    },
                } = res;
              expect(getPodcast.ok).toBe(false);
              expect(getPodcast.error).toBe(`Podcast with id 666 not found`);
            });
        });
    });

    describe('getEpidoses', () => {
        let podcastId: number;
        beforeAll(async () => {
            const podcast = await podcastsRepository.findOne(
                {
                    id:1
                },
                {
                    relations:['episodes']
                }
            );
            podcastId = podcast.id;
        });
        it('should get all episodes', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              {
                getEpisodes(input:{
                    id:${podcastId}
                }){
                  ok
                  error
                  episodes{
                    id
                    title
                    category
                  }
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { getEpisodes },
                    },
                } = res;
              expect(getEpisodes.ok).toBe(true);
              expect(getEpisodes.error).toBe(null);
              expect(getEpisodes.episodes[0].id).toBe(1);
              expect(getEpisodes.episodes[0].title).toBe(createEpisode.title);
              expect(getEpisodes.episodes[0].category).toBe(createEpisode.category);
            });
        });
    });
    
    describe('getEpidose', () => {
        let podcastId: number;
        let episodeId: number;
        beforeAll(async () => {
            const podcast = await podcastsRepository.findOne(
                {
                    id:1
                },
                {
                    relations:['episodes']
                }
            );

            podcastId = podcast.id;

            const episode = await episodesRepository.findOne(
                {
                    id:1
                },
                {
                    relations:['podcast'],
                    where:{
                        id:podcastId
                    }
                }
            );
            episodeId=episode.id;
        });
        it('should get a episode', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              {
                getEpisode(input:{
                    podcastId:${podcastId}
                    episodeId:${episodeId}
                  }){
                    ok
                    error
                    episode{
                        id
                        title
                        category
                    }
                  }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { getEpisode },
                    },
                } = res;
              expect(getEpisode.ok).toBe(true);
              expect(getEpisode.error).toBe(null);
              expect(getEpisode.episode.id).toBe(1);
              expect(getEpisode.episode.title).toBe(createEpisode.title);
              expect(getEpisode.episode.category).toBe(createEpisode.category);
            });
        });

        it('should not get a episode', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              {
                getEpisode(input:{
                    podcastId:${podcastId}
                    episodeId:666
                }){
                  ok
                  error
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { getEpisode },
                    },
                } = res;
              expect(getEpisode.ok).toBe(false);
              expect(getEpisode.error).toBe(`Episode with id 666 not found in podcast with id 1`);
            });
        });
    });

    describe('updatePodcast', () => {
        let podcastId: number;
        beforeAll(async () => {
            const podcast = await podcastsRepository.findOne(
                {
                    id:1
                },
                {
                    relations:['episodes']
                }
            );

            podcastId = podcast.id;
        });
        it('should update podcast', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              mutation {
                updatePodcast(input: {
                    id:${podcastId},
                    payload:{
                        title:"${updatePodcast.title}",
                        category:"${updatePodcast.category}",
                    }
                }) {
                  ok
                  error
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { updatePodcast },
                    },
                } = res;
              expect(updatePodcast.ok).toBe(true);
              expect(updatePodcast.error).toBe(null);
            });
        });

        it('should not update podcast because rating in not between 1 to 5', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              mutation {
                updatePodcast(input: {
                    id:${podcastId},
                    payload:{
                        title:"${updatePodcast.title}",
                        category:"${updatePodcast.category}",
                        rating:7
                    }
                }) {
                  ok
                  error
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { updatePodcast },
                    },
                } = res;
              expect(updatePodcast.ok).toBe(false);
              expect(updatePodcast.error).toBe('Rating must be between 1 and 5.');
            });
        });
    });

    describe('updateEpisode', () => {
        let podcastId: number;
        let episodeId: number;
        beforeAll(async () => {
            const podcast = await podcastsRepository.findOne(
                {
                    id:1
                },
                {
                    relations:['episodes']
                }
            );

            podcastId = podcast.id;

            const episode = await episodesRepository.findOne(
                {
                    id:1
                },
                {
                    relations:['podcast'],
                    where:{
                        id:podcastId
                    }
                }
            );
            episodeId=episode.id;
        });
        it('should update a episode', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              mutation {
                updateEpisode(input: {
                    podcastId:${podcastId},
                    episodeId:${episodeId},
                    title:"${updateEpisode.title}",
                    category:"${updateEpisode.category}",
                }) {
                  ok
                  error
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { updateEpisode },
                    },
                } = res;
              expect(updateEpisode.ok).toBe(true);
              expect(updateEpisode.error).toBe(null);
            });
        });
    });

    describe('deleteEpisode', () => {
        let podcastId: number;
        let episodeId: number;
        beforeAll(async () => {
            const podcast = await podcastsRepository.findOne(
                {
                    id:1
                },
                {
                    relations:['episodes']
                }
            );

            podcastId = podcast.id;

            const episode = await episodesRepository.findOne(
                {
                    id:1
                },
                {
                    relations:['podcast'],
                    where:{
                        id:podcastId
                    }
                }
            );
            episodeId=episode.id;
        });
        it('should delete a episode', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              mutation {
                deleteEpisode(input: {
                    podcastId:${podcastId},
                    episodeId:${episodeId},
                }) {
                  ok
                  error
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { deleteEpisode },
                    },
                } = res;
              expect(deleteEpisode.ok).toBe(true);
              expect(deleteEpisode.error).toBe(null);
            });
        });
    });

    describe('deletePodcast', () => {
        let podcastId: number;
        beforeAll(async () => {
            const podcast = await podcastsRepository.findOne(
                {
                    id:1
                },
                {
                    relations:['episodes']
                }
            );

            podcastId = podcast.id;
        });
        it('should delete a podcast', () => {
            return request(app.getHttpServer())
            .post(GRAPHQL_ENDPOINT)
            .send({
              query: `
              mutation {
                deletePodcast(input: {
                    id:${podcastId}
                }) {
                  ok
                  error
                }
              }
              `,
            })
            .expect(200)
            .expect(res => {
                const {
                    body: {
                        data: { deletePodcast },
                    },
                } = res;
              expect(deletePodcast.ok).toBe(true);
              expect(deletePodcast.error).toBe(null);
            });
        });
    });
});