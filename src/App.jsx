import { useEffect, useState } from 'react'
import { useDebounce } from "react-use";

import './App.css'
import Search from './components/Search'
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

const API_BASE_URL = "https://api.themoviedb.org/3"

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
    method: "GET",
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
}

const App = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [movieList, setMovieList] = useState([])
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

    const [trendingErrorMessage, setTrendingErrorMessage] = useState('')
    const [trendingMovies, setTrendingMovies] = useState([])

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm])

    const fetchMovies = async (query = '') => {
        
        try {
            setIsLoading(true)
            const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`
            const response = await fetch(endpoint, API_OPTIONS)

            if  (!response.ok) {
                throw new Error("Failed to fetch movies. Please try again later")
            }
            const data = await response.json()
            
            if (data.Response === "False") {
                setErrorMessage(data.Error || "Failed to fetch movies")
                setMovieList([])
                return;
            }

            setMovieList(data.results || [])
            if (query && data.results.length > 0)  {
                await updateSearchCount(query, data.results[0])
            }
            updateSearchCount()
        } catch (e) {
            console.error(`Error fetching movies. Please try again later.`)
        } finally {
            setIsLoading(false)
        }
    }

    const loadTrendingMovies = async () => {
        try {
            setIsLoading(true)
            const movies = await getTrendingMovies()
            setTrendingMovies(movies)
        } catch (e) {
            // console.log(`Error fetching trending movies: ${e}.`)
            setTrendingErrorMessage(`An error occurred while fetching trending movies. Please try later.`)
        }
        finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearchTerm)
    }, [debouncedSearchTerm])

    useEffect(() => {
        loadTrendingMovies()
    }, [])

    return (
        <main>
            {/* <div className="pattern" /> */}

            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero Banner" />
                    <h1>Find <span className='text-gradient'>Movies</span> You'll Enjoy Withouth the Hussle</h1>

                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>
                { trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending movies</h2>
                        { trendingErrorMessage != '' ? (
                            <ul>
                                {trendingMovies.map((movie, index) => (
                                    <li key={movie.$id}>
                                        <p>{index+1}</p>
                                        <img src={movie.poster_url} alt={movie.title}/>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-red-500">{trendingErrorMessage}</p>
                        ) }

                    </section>
                ) }
                <section>

                </section>
                <section className='all-movies'>
                    <h2>All Movies</h2>
                    {
                        isLoading ? (<Spinner />) : errorMessage ? (
                            <p className='text-red-500'>{errorMessage}</p>
                        ) : (
                            <ul>
                                {movieList.map((movie) => (
                                    movie.title === "Heavenly Touch" ? (() => setMovieList((prevState) => delete prevState[prevState.indexOf(movie)])) : (
                                            <MovieCard key={movie.id} movie={movie}/>)

                                ))}
                            </ul>
                        )
                    }
                </section>
            </div>
        </main>
    )
}
export default App
