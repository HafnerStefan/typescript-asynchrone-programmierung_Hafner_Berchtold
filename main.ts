import fetch, {Response} from "node-fetch";
import {map, mergeMap} from "rxjs/operators";
import {get} from "./utils";
import {forkJoin, of} from "rxjs";

/*
Read data from https://swapi.dev/api/people/1 (Luke Skywalker)
and dependent data from swapi to return the following object

{
    name: 'Luke Skywalker',
    height: 172,
    gender: 'male',
    homeworld: 'Tatooine',
    films: [
        {
            title: 'A New Hope',
            director: 'George Lucas',
            release_date: '1977-05-25'
        },
        ... // and all other films
    ]
}

Define an interface of the result type above and all other types as well.

*/

interface Person {
  name: string;
  height: string;
  gender: "male" | "female" | "divers";
  homeworld: string;
  films: string[];
}

export interface PersonInfo {
  // TODO: define type
  name: string;
  height: string;
  gender: string;
  homeworld: string;
  films: {
    title: string;
    director: string;
    release_date: string;
  }[];
}

// Task 1: write a function using promise based fetch api
type PromiseBasedFunction = () => Promise<PersonInfo>;
export const getLukeSkywalkerInfo: PromiseBasedFunction = () => {
  return fetch("https://swapi.dev/api/people/1").then((response: Response) => {
    return response.json().then((person: Person) => {
      // TODO: load other stuff and return LukeSkywalkerInfo
      // Fetch homeworld data
      return fetch(person.homeworld)
          .then((homeworldResponse: Response) => homeworldResponse.json())
          .then((homeworld: { name: string }) => {
            // Fetch film data
            const filmPromises = person.films.map((filmUrl: string) =>
                fetch(filmUrl)
                    .then((filmResponse: Response) => filmResponse.json())
                    .then((film: { title: string; director: string; release_date: string }) => ({
                      title: film.title,
                      director: film.director,
                      release_date: film.release_date,
                    }))
            );

            // Wait for all film data to be fetched
            return Promise.all(filmPromises).then((films) => {
              return {
                name: person.name,
                height: person.height,
                gender: person.gender,
                homeworld: homeworld.name,
                films: films,
              } as PersonInfo;
            });
          });
    });
  });
};


// Task 2: write a function using async and await
// see also: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-7.html
type AsyncBasedFunction = () => Promise<PersonInfo>;
export const getLukeSkywalkerInfoAsync: PromiseBasedFunction = async () => {
  const response = await fetch("https://swapi.dev/api/people/1");
  // TODO: load other stuff and return LukeSkywalkerInfo
  const person: Person = await response.json();
  const homeworldResponse = await fetch(person.homeworld);
  const homeworld = await homeworldResponse.json();

  const films = [];
  for (const filmUrl of person.films) {
    const filmResponse = await fetch(filmUrl);
    const film = await filmResponse.json();
    films.push({
      title: film.title,
      director: film.director,
      release_date: film.release_date,
    });
  }

  return {
    name: person.name,
    height: person.height,
    gender: person.gender,
    homeworld: homeworld.name,
    films: films,
  } as PersonInfo;
};

// Task 3: write a function using Observable based api
// see also: https://rxjs.dev/api/index/function/forkJoin
export const getLukeSkywalkerInfoObservable = () => {
  return get<Person>("https://swapi.dev/api/people/1").pipe(
      mergeMap((person: Person) => {
        // TODO: load other stuff and return LukeSkywalkerInfo
        // Load the home world and the films in parallel
        return forkJoin({
          homeworld: get<{ name: string }>(person.homeworld),
          films: forkJoin(person.films.map(filmUrl => get<{
            title: string;
            director: string;
            release_date: string
          }>(filmUrl)))
        }).pipe(
            // Combine the loaded data into a PersonInfo object
            map(({homeworld, films}) => ({
              name: person.name,
              height: person.height,
              gender: person.gender,
              homeworld: homeworld.name,
              films: films.map(film => ({
                title: film.title,
                director: film.director,
                release_date: film.release_date,
              }))
            } as PersonInfo))
        );
      })
  );
};


