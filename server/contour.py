'''
The code for generating the contour of current selection

kernel_density: performs 2d histogram-based approximated kde (HAKDE)
marching_squares: perform marching squares algorithm for final contour computation

'''

import numpy as np 
import math



def generate(current_selection, current_emb, max_emb, min_emb):

    grid_matrix = np.zeros((20, 20))
    kernel_density(current_selection, current_emb, grid_matrix, max_emb, min_emb)



## current_selection: current selected points which needs to be density-estimated
## gird_matrix: stores grid value based on kernel density estimation (should be np array, zero-initialized)
## max_emb: max value of the embedding ([x, y])
## min_emb: min value of the embedding ([x, y])
def kernel_density(current_selection, current_emb, grid_matrix, max_emb, min_emb):
    grid_size = grid_matrix.shape[0]

    range_emb = max_emb - min_emb

    def x_scale(val):
        scaled = (val - max_emb[0]) / range_emb[0]
        scaled = round((grid_size - 1) * scaled)
        return scaled

    def y_scale(val):
        scaled = (val - max_emb[1]) / range_emb[1]
        scaled = round((grid_size - 1) * scaled)
        return scaled

    ## ALL steps can be parallelized

    ## generate grid-wise (historgram-based) distribution of the points
    grid_distribution = np.zeros_like(grid_matrix, dtype=np.int32)
    for idx in current_selection:
        scaled = [x_scale(current_emb[idx][0]), y_scale(current_emb[idx][1])]
        grid_distribution[scaled[0], scaled[1]] += 1


    ## generate grid vertex value info
    ## 현재 naive한 삼각형 커널
    for i in range(grid_size):
        for j in range(grid_size):
            value = grid_distribution[i][j]
            kernel_size = 2
            for ii in range(-kernel_size, kernel_size + 1):
                for jj in range(-kernel_size, kernel_size + 1):
                    
                    dist = abs(ii) + abs(jj)
                    if (dist > value) or (i + ii >= grid_size) or (j + jj >= grid_size):
                        continue 
                    current_kernel_density = value - dist
                    grid_matrix[i + ii, j + jj] += current_kernel_density
    
    print(grid_matrix)

    
    
            


    


    
    pass

def marching_squares():
    pass